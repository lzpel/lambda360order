use gltf_json as json;
use opencascade::primitives::Shape;
use std::io::Write;

/// GLB (GLTF Binary) を生成する。OCCのインデックス付きメッシュをそのまま使用。
pub fn create_glb(mesh: &opencascade::mesh::Mesh, shape: &Shape) -> Result<Vec<u8>, String> {
	use json::validation::Checked::Valid;

	// OCCのメッシュデータをf32に変換（KHR_materials_unlit使用のため法線は不要）
	let positions: Vec<[f32; 3]> = mesh
		.vertices
		.iter()
		.map(|v| [v.x as f32, v.y as f32, v.z as f32])
		.collect();

	// POSITIONのmin/maxを計算（glTF spec必須）
	let mut pos_min = [f32::INFINITY; 3];
	let mut pos_max = [f32::NEG_INFINITY; 3];
	for p in &positions {
		for i in 0..3 {
			pos_min[i] = pos_min[i].min(p[i]);
			pos_max[i] = pos_max[i].max(p[i]);
		}
	}

	// インデックス: 頂点数 ≤ 65535 なら U16 (2 bytes/idx)、超えたら U32 (4 bytes/idx)
	let idx_count = mesh.indices.len();
	let (idx_bytes_owned, idx_component_type) = if positions.len() <= 65535 {
		let v: Vec<u16> = mesh.indices.iter().map(|&i| i as u16).collect();
		let bytes =
			unsafe { std::slice::from_raw_parts(v.as_ptr() as *const u8, v.len() * 2) }.to_vec();
		(bytes, json::accessor::ComponentType::U16)
	} else {
		let v: Vec<u32> = mesh.indices.iter().map(|&i| i as u32).collect();
		let bytes =
			unsafe { std::slice::from_raw_parts(v.as_ptr() as *const u8, v.len() * 4) }.to_vec();
		(bytes, json::accessor::ComponentType::U32)
	};

	// バイナリバッファ: indices | pad | positions | edges
	let mut buffer = Vec::new();
	buffer.extend_from_slice(&idx_bytes_owned);
	let idx_len = idx_bytes_owned.len();
	while buffer.len() % 4 != 0 {
		buffer.push(0);
	}

	let pos_offset = buffer.len();
	let pos_bytes = unsafe {
		std::slice::from_raw_parts(positions.as_ptr() as *const u8, positions.len() * 12)
	};
	buffer.extend_from_slice(pos_bytes);
	let pos_len = pos_bytes.len();

	// エッジデータ
	let mut edge_data: Vec<f32> = Vec::new();
	for edge in shape.edges() {
		let segments: Vec<_> = edge.approximation_segments().collect();
		for w in segments.windows(2) {
			edge_data.extend_from_slice(&[
				w[0].x as f32,
				w[0].y as f32,
				w[0].z as f32,
				w[1].x as f32,
				w[1].y as f32,
				w[1].z as f32,
			]);
		}
	}

	// エッジデータをBIN chunkに追加（JSON extrasに入れるとJSONが膨大になるため）
	let edge_bytes =
		unsafe { std::slice::from_raw_parts(edge_data.as_ptr() as *const u8, edge_data.len() * 4) };
	let edge_offset = buffer.len();
	buffer.extend_from_slice(edge_bytes);
	let edge_len = edge_bytes.len();

	// glTF JSON構築
	let mut root = json::Root::default();
	root.buffers.push(json::Buffer {
		byte_length: json::validation::USize64(buffer.len() as u64),
		name: None,
		uri: None,
		extensions: None,
		extras: Default::default(),
	});

	// BufferView[0] / Accessor[0]: indices
	root.buffer_views.push(json::buffer::View {
		buffer: json::Index::new(0),
		byte_length: json::validation::USize64(idx_len as u64),
		byte_offset: Some(json::validation::USize64(0)),
		byte_stride: None,
		name: None,
		target: Some(Valid(json::buffer::Target::ElementArrayBuffer)),
		extensions: None,
		extras: Default::default(),
	});
	root.accessors.push(json::Accessor {
		buffer_view: Some(json::Index::new(0)),
		byte_offset: Some(json::validation::USize64(0)),
		count: json::validation::USize64(idx_count as u64),
		component_type: Valid(json::accessor::GenericComponentType(idx_component_type)),
		type_: Valid(json::accessor::Type::Scalar),
		extensions: None,
		extras: Default::default(),
		min: None,
		max: None,
		name: None,
		normalized: false,
		sparse: None,
	});

	// BufferView[1] / Accessor[1]: positions (ARRAY_BUFFER, F32, VEC3)
	root.buffer_views.push(json::buffer::View {
		buffer: json::Index::new(0),
		byte_length: json::validation::USize64(pos_len as u64),
		byte_offset: Some(json::validation::USize64(pos_offset as u64)),
		byte_stride: None,
		name: None,
		target: Some(Valid(json::buffer::Target::ArrayBuffer)),
		extensions: None,
		extras: Default::default(),
	});
	root.accessors.push(json::Accessor {
		buffer_view: Some(json::Index::new(1)),
		byte_offset: Some(json::validation::USize64(0)),
		count: json::validation::USize64(positions.len() as u64),
		component_type: Valid(json::accessor::GenericComponentType(
			json::accessor::ComponentType::F32,
		)),
		type_: Valid(json::accessor::Type::Vec3),
		extensions: None,
		extras: Default::default(),
		min: Some(serde_json::json!([pos_min[0], pos_min[1], pos_min[2]])),
		max: Some(serde_json::json!([pos_max[0], pos_max[1], pos_max[2]])),
		name: None,
		normalized: false,
		sparse: None,
	});

	// Primitive: indexed triangles（normals なし、material は後でJSONに注入）
	let primitive = json::mesh::Primitive {
		attributes: {
			let mut map = std::collections::BTreeMap::new();
			map.insert(Valid(json::mesh::Semantic::Positions), json::Index::new(1));
			map
		},
		indices: Some(json::Index::new(0)),
		extensions: None,
		extras: Default::default(),
		material: None,
		mode: Valid(json::mesh::Mode::Triangles),
		targets: None,
	};
	root.meshes.push(json::Mesh {
		extensions: None,
		extras: Default::default(),
		name: None,
		primitives: vec![primitive],
		weights: None,
	});

	// Accessor[2]: edges orphan（BIN chunk内、どのmesh primitiveにも参照されない）
	// normals を削除したため index 2（旧: 3）
	if !edge_data.is_empty() {
		root.buffer_views.push(json::buffer::View {
			buffer: json::Index::new(0),
			byte_length: json::validation::USize64(edge_len as u64),
			byte_offset: Some(json::validation::USize64(edge_offset as u64)),
			byte_stride: None,
			name: None,
			target: Some(Valid(json::buffer::Target::ArrayBuffer)),
			extensions: None,
			extras: Default::default(),
		});
		root.accessors.push(json::Accessor {
			buffer_view: Some(json::Index::new(2)),
			byte_offset: Some(json::validation::USize64(0)),
			count: json::validation::USize64((edge_data.len() / 3) as u64),
			component_type: Valid(json::accessor::GenericComponentType(
				json::accessor::ComponentType::F32,
			)),
			type_: Valid(json::accessor::Type::Vec3),
			extensions: None,
			extras: Default::default(),
			min: None,
			max: None,
			name: None,
			normalized: false,
			sparse: None,
		});
		root.extras = Some(
			serde_json::value::RawValue::from_string(
				serde_json::to_string(&serde_json::json!({ "edgeAccessor": 2 }))
					.map_err(|e| e.to_string())?,
			)
			.map_err(|e| e.to_string())?,
		);
	}

	root.nodes.push(json::Node {
		mesh: Some(json::Index::new(0)),
		..Default::default()
	});
	root.scenes.push(json::Scene {
		extensions: None,
		extras: Default::default(),
		name: None,
		nodes: vec![json::Index::new(0)],
	});
	root.scene = Some(json::Index::new(0));

	// gltf-json でシリアライズ後、KHR_materials_unlit マテリアルを serde_json で注入
	// （gltf-json の KHR_materials_unlit は feature flag が必要なため直接注入する）
	let json_string = json::serialize::to_string(&root).map_err(|e| e.to_string())?;
	let mut json_val: serde_json::Value =
		serde_json::from_str(&json_string).map_err(|e| e.to_string())?;

	json_val["extensionsUsed"] = serde_json::json!(["KHR_materials_unlit"]);
	json_val["materials"] = serde_json::json!([{
		"extensions": { "KHR_materials_unlit": {} },
		"pbrMetallicRoughness": {
			"baseColorFactor": [0.8, 0.8, 0.8, 1.0],
			"metallicFactor": 0.0,
			"roughnessFactor": 1.0
		},
		"alphaMode": "OPAQUE",
		"doubleSided": true
	}]);
	json_val["meshes"][0]["primitives"][0]["material"] = serde_json::json!(0);

	let json_string = serde_json::to_string(&json_val).map_err(|e| e.to_string())?;
	let mut json_bytes = json_string.into_bytes();
	while json_bytes.len() % 4 != 0 {
		json_bytes.push(b' ');
	}

	let mut glb = Vec::new();
	let total_size = 12 + 8 + json_bytes.len() + 8 + buffer.len();
	glb.write_all(b"glTF").unwrap();
	glb.write_all(&2u32.to_le_bytes()).unwrap();
	glb.write_all(&(total_size as u32).to_le_bytes()).unwrap();
	glb.write_all(&(json_bytes.len() as u32).to_le_bytes())
		.unwrap();
	glb.write_all(b"JSON").unwrap();
	glb.write_all(&json_bytes).unwrap();
	glb.write_all(&(buffer.len() as u32).to_le_bytes()).unwrap();
	glb.write_all(b"BIN\0").unwrap();
	glb.write_all(&buffer).unwrap();

	Ok(glb)
}

#[cfg(test)]
mod tests {
	use crate::openapi::*;
	use crate::shape::shape;
	use opencascade::primitives::Shape;
	use std::collections::HashMap;

	/// cargo test の作業ディレクトリは api/ (Cargo.toml のある場所)
	const TEST_BREP_PATH: &str = "../public/PA-001-DF7.brep";
	const TEST_KEY: &str = "test_brep_sha256";

	fn load_test_shape() -> Shape {
		Shape::read_brep(TEST_BREP_PATH)
			.or_else(|_| Shape::read_brep_bin(TEST_BREP_PATH))
			.expect("テスト用BRepファイルが見つかりません: ../public/PA-001-DF7.brep")
	}

	fn shapes_map(key: &str) -> HashMap<String, Shape> {
		let mut m = HashMap::new();
		m.insert(key.to_string(), load_test_shape());
		m
	}

	fn step_node(key: &str) -> ShapeNode {
		ShapeNode::Step(StepNode {
			content_hash: key.to_string(),
			description: None,
		})
	}

	#[test]
	fn shape_step_node_returns_glb() {
		let result = shape(&step_node(TEST_KEY), shapes_map(TEST_KEY));
		assert!(
			result.is_ok(),
			"shape() がエラーを返しました: {:?}",
			result.err()
		);

		let glb = result.unwrap();
		assert!(!glb.is_empty());
		// GLB マジックバイト確認
		assert_eq!(&glb[0..4], b"glTF");
		// GLB バージョン = 2
		assert_eq!(u32::from_le_bytes(glb[4..8].try_into().unwrap()), 2);
	}

	#[test]
	fn shape_missing_brep_returns_err() {
		let result = shape(&step_node("nonexistent"), HashMap::new());
		assert!(result.is_err());
		assert!(
			result.unwrap_err().contains("not found"),
			"エラーメッセージに 'not found' が含まれるべき"
		);
	}

	/// ../public/PA-001-DF7.brep → ../public/PA-001-DF7.glb を生成する
	/// cargo test -p api -- generate_glb --include-ignored で実行
	#[test]
	#[ignore]
	fn generate_glb() {
		let glb =
			shape(&step_node(TEST_KEY), shapes_map(TEST_KEY)).expect("GLBの生成に失敗しました");
		std::fs::write("../public/PA-001-DF7.glb", &glb)
			.expect("GLBファイルの書き込みに失敗しました");
		println!("生成完了: ../public/PA-001-DF7.glb ({} bytes)", glb.len());
	}

	#[test]
	fn shape_unsupported_node_returns_err() {
		let node = ShapeNode::Union(UnionShapeNode {
			a: Box::new(step_node("a")),
			b: Box::new(step_node("b")),
		});

		let result = shape(&node, HashMap::new());
		assert!(result.is_err());
		assert!(
			result.unwrap_err().contains("Only StepNode"),
			"エラーメッセージに 'Only StepNode' が含まれるべき"
		);
	}
}
