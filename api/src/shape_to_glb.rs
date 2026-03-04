use chijin::Shape;
use gltf_json as json;
use std::io::Write;

/// GLB (GLTF Binary) を生成する。
/// shape.colormap が空の場合はグレー単色プリミティブ、
/// 色情報がある場合は色グループ別プリミティブを生成する。
pub fn create_glb(shape: &Shape) -> Result<Vec<u8>, String> {
	let mesh = shape
		.mesh_with_tolerance(0.1)
		.map_err(|e| format!("mesh_with_tolerance failed: {:?}", e))?;

	// Rgb は Hash 未実装なので bits() でキー化
	fn rgb_key(rgb: chijin::Rgb) -> (u32, u32, u32) {
		(rgb.r.to_bits(), rgb.g.to_bits(), rgb.b.to_bits())
	}

	// 三角形を色グループ別インデックスリストに振り分ける
	// face_ids.len() == indices.len() / 3
	let mut groups: std::collections::HashMap<(u32, u32, u32), (Option<chijin::Rgb>, Vec<usize>)> =
		std::collections::HashMap::new();
	for (tri_idx, &face_id) in mesh.face_ids.iter().enumerate() {
		let rgb = shape.colormap.get(&chijin::TShapeId(face_id)).copied();
		let key = rgb.map(rgb_key).unwrap_or((0, 0, 0));
		let entry = groups.entry(key).or_insert((rgb, Vec::new()));
		entry
			.1
			.extend_from_slice(&mesh.indices[tri_idx * 3..tri_idx * 3 + 3]);
	}

	// グループが1つかつ色なし → グレー単色（従来と同等）
	// グループが1つかつ色あり → その色で単色
	// グループが複数 → 色別プリミティブ
	let groups: Vec<(Option<chijin::Rgb>, Vec<usize>)> = groups.into_values().collect();

	build_glb(shape, &mesh, &groups)
}

/// 色グループ別プリミティブの GLB を組み立てる。
/// 頂点バッファは全グループで共有し、インデックスバッファだけ色ごとに分ける。
fn build_glb(
	shape: &Shape,
	mesh: &chijin::Mesh,
	groups: &[(Option<chijin::Rgb>, Vec<usize>)],
) -> Result<Vec<u8>, String> {
	use json::validation::Checked::Valid;

	let positions: Vec<[f32; 3]> = mesh
		.vertices
		.iter()
		.map(|v| [v.x as f32, v.y as f32, v.z as f32])
		.collect();

	let mut pos_min = [f32::INFINITY; 3];
	let mut pos_max = [f32::NEG_INFINITY; 3];
	for p in &positions {
		for i in 0..3 {
			pos_min[i] = pos_min[i].min(p[i]);
			pos_max[i] = pos_max[i].max(p[i]);
		}
	}

	let mut root = json::Root::default();
	root.buffers.push(json::Buffer {
		byte_length: json::validation::USize64(0),
		name: None,
		uri: None,
		extensions: None,
		extras: Default::default(),
	});

	let mut buffer: Vec<u8> = Vec::new();

	// 頂点バッファ（全グループ共有）
	let pos_bytes = unsafe {
		std::slice::from_raw_parts(positions.as_ptr() as *const u8, positions.len() * 12)
	};
	let pos_view = root.buffer_views.len() as u32;
	buffer.extend_from_slice(pos_bytes);
	root.buffer_views.push(json::buffer::View {
		buffer: json::Index::new(0),
		byte_length: json::validation::USize64(pos_bytes.len() as u64),
		byte_offset: Some(json::validation::USize64(0)),
		byte_stride: None,
		name: None,
		target: Some(Valid(json::buffer::Target::ArrayBuffer)),
		extensions: None,
		extras: Default::default(),
	});
	let pos_accessor = root.accessors.len() as u32;
	root.accessors.push(json::Accessor {
		buffer_view: Some(json::Index::new(pos_view)),
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

	// 色グループごとにインデックスバッファ + プリミティブを生成
	let mut primitives: Vec<json::mesh::Primitive> = Vec::new();
	let mut materials: Vec<serde_json::Value> = Vec::new();

	for (color, indices) in groups {
		let idx_count = indices.len();
		let (idx_bytes, idx_component_type) = if positions.len() <= 65535 {
			let v: Vec<u16> = indices.iter().map(|&i| i as u16).collect();
			let bytes = unsafe { std::slice::from_raw_parts(v.as_ptr() as *const u8, v.len() * 2) }
				.to_vec();
			(bytes, json::accessor::ComponentType::U16)
		} else {
			let v: Vec<u32> = indices.iter().map(|&i| i as u32).collect();
			let bytes = unsafe { std::slice::from_raw_parts(v.as_ptr() as *const u8, v.len() * 4) }
				.to_vec();
			(bytes, json::accessor::ComponentType::U32)
		};

		let idx_view = root.buffer_views.len() as u32;
		let idx_offset = buffer.len();
		buffer.extend_from_slice(&idx_bytes);
		while buffer.len() % 4 != 0 {
			buffer.push(0);
		}
		root.buffer_views.push(json::buffer::View {
			buffer: json::Index::new(0),
			byte_length: json::validation::USize64(idx_bytes.len() as u64),
			byte_offset: Some(json::validation::USize64(idx_offset as u64)),
			byte_stride: None,
			name: None,
			target: Some(Valid(json::buffer::Target::ElementArrayBuffer)),
			extensions: None,
			extras: Default::default(),
		});
		let idx_accessor = root.accessors.len() as u32;
		root.accessors.push(json::Accessor {
			buffer_view: Some(json::Index::new(idx_view)),
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

		let material_index = materials.len() as u32;
		let (r, g, b) = color
			.map(|c| (c.r as f64, c.g as f64, c.b as f64))
			.unwrap_or((0.8, 0.8, 0.8));
		materials.push(serde_json::json!({
			"extensions": { "KHR_materials_unlit": {} },
			"pbrMetallicRoughness": {
				"baseColorFactor": [r, g, b, 1.0],
				"metallicFactor": 0.0,
				"roughnessFactor": 1.0
			},
			"alphaMode": "OPAQUE",
			"doubleSided": true
		}));

		primitives.push(json::mesh::Primitive {
			attributes: {
				let mut map = std::collections::BTreeMap::new();
				map.insert(
					Valid(json::mesh::Semantic::Positions),
					json::Index::new(pos_accessor),
				);
				map
			},
			indices: Some(json::Index::new(idx_accessor)),
			extensions: None,
			extras: Default::default(),
			material: Some(json::Index::new(material_index)),
			mode: Valid(json::mesh::Mode::Triangles),
			targets: None,
		});
	}

	// エッジデータ
	let mut edge_data: Vec<f32> = Vec::new();
	for edge in shape.edges() {
		let segments: Vec<_> = edge.approximation_segments(0.1).collect();
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
	let edge_accessor_index = if !edge_data.is_empty() {
		let edge_bytes = unsafe {
			std::slice::from_raw_parts(edge_data.as_ptr() as *const u8, edge_data.len() * 4)
		};
		let edge_view = root.buffer_views.len() as u32;
		let edge_offset = buffer.len();
		buffer.extend_from_slice(edge_bytes);
		root.buffer_views.push(json::buffer::View {
			buffer: json::Index::new(0),
			byte_length: json::validation::USize64(edge_bytes.len() as u64),
			byte_offset: Some(json::validation::USize64(edge_offset as u64)),
			byte_stride: None,
			name: None,
			target: Some(Valid(json::buffer::Target::ArrayBuffer)),
			extensions: None,
			extras: Default::default(),
		});
		let accessor_index = root.accessors.len() as u32;
		root.accessors.push(json::Accessor {
			buffer_view: Some(json::Index::new(edge_view)),
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
		Some(accessor_index)
	} else {
		None
	};

	root.buffers[0].byte_length = json::validation::USize64(buffer.len() as u64);

	root.meshes.push(json::Mesh {
		extensions: None,
		extras: Default::default(),
		name: None,
		primitives,
		weights: None,
	});
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

	// JSON 組み立て・マテリアル注入・GLB バイナリ出力
	let json_string = json::serialize::to_string(&root).map_err(|e| e.to_string())?;
	let mut json_val: serde_json::Value =
		serde_json::from_str(&json_string).map_err(|e| e.to_string())?;

	json_val["extensionsUsed"] = serde_json::json!(["KHR_materials_unlit"]);
	json_val["materials"] = serde_json::Value::Array(materials);
	if let Some(idx) = edge_accessor_index {
		json_val["extras"] = serde_json::json!({ "edgeAccessor": idx });
	}

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
	use chijin::Shape;

	use std::collections::HashMap;

	const TEST_BREP_PATH: &str = "../public/PA-001-DF7.brep";
	const TEST_KEY: &str = "test_brep_sha256";

	fn load_test_shape() -> Shape {
		let data = std::fs::read(TEST_BREP_PATH)
			.expect("テスト用BRepファイルが見つかりません: ../public/PA-001-DF7.brep");
		Shape::read_brep_color(&mut std::io::Cursor::new(&data))
			.or_else(|_| Shape::read_brep_bin(&mut std::io::Cursor::new(&data)))
			.or_else(|_| Shape::read_brep_text(&mut std::io::Cursor::new(&data)))
			.expect("テスト用BRepファイルが読み込めません: ../public/PA-001-DF7.brep")
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
		assert_eq!(&glb[0..4], b"glTF");
		assert_eq!(u32::from_le_bytes(glb[4..8].try_into().unwrap()), 2);
	}

	#[test]
	fn shape_missing_brep_returns_err() {
		let result = shape(&step_node("nonexistent"), HashMap::new());
		assert!(result.is_err());
		assert!(result.unwrap_err().contains("not found"));
	}

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
		assert!(result.unwrap_err().contains("Only StepNode"));
	}
}
