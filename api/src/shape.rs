use crate::openapi::*;
use gltf_json as json;
use ngoni;
use opencascade::primitives::Shape;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::io::Write;

/// ShapeNodeのstep命令を再帰的に収集し、必要なbrepファイルをHashMapにまとめる。
/// StepNode.pathはフロントエンドがSTEPファイルのsha256に置換済み。
/// bucket_memoに `{sha256}.brep` が存在しなければエラーを返す（アップロード/変換未完了）。
///
/// Phase 1: ShapeNodeを再帰的に走査してsha256キーをHashSetに収集（同期）
/// Phase 2: HashSetのキーを元にbucket_memoから並列ダウンロードしてHashMapに格納
pub async fn collect_breps(
	node: &ShapeNode,
	bucket_memo: &ngoni::s3::S3Storage,
) -> Result<HashMap<String, Vec<u8>>, String> {
	// Phase 1: sha256キーの収集（重複排除）
	let mut keys = std::collections::HashSet::new();
	collect_keys(node, &mut keys);

	// Phase 2: 並列ダウンロード（&S3StorageはCopyなのでasync moveでキャプチャ可能）
	let futures = keys.into_iter().map(|sha256| async move {
		let key = format!("{}.brep", sha256);
		match bucket_memo.read(&key).await {
			Ok((_meta, data)) => Ok((sha256, data)),
			Err(_) => Err(format!(
				"BRep for '{}' not found in memo bucket; STEP upload/conversion may be incomplete.",
				sha256
			)),
		}
	});

	let pairs = futures_util::future::try_join_all(futures).await?;
	Ok(pairs.into_iter().collect())
}

/// ShapeNodeを再帰的に走査してStepNodeのsha256キーをHashSetに収集する（同期）
fn collect_keys(node: &ShapeNode, keys: &mut std::collections::HashSet<String>) {
	match node {
		ShapeNode::Step(step) => {
			keys.insert(step.path.clone());
		}
		ShapeNode::Union(n) => {
			collect_keys(&n.a, keys);
			collect_keys(&n.b, keys);
		}
		ShapeNode::Intersect(n) => {
			collect_keys(&n.a, keys);
			collect_keys(&n.b, keys);
		}
		ShapeNode::Subtract(n) => {
			collect_keys(&n.a, keys);
			collect_keys(&n.b, keys);
		}
		ShapeNode::Scale(n) => {
			collect_keys(&n.shape, keys);
		}
		ShapeNode::Translate(n) => {
			collect_keys(&n.shape, keys);
		}
		ShapeNode::Rotate(n) => {
			collect_keys(&n.shape, keys);
		}
		ShapeNode::Stretch(n) => {
			collect_keys(&n.shape, keys);
		}
	}
}

/// ShapeNodeのJSONをsha256にしてbucket_memoをチェックし、キャッシュヒットならGLBを返す。
/// キャッシュミスの場合はshape()でGLBを計算して保存してから返す。
pub async fn cached_shape(
	node: &ShapeNode,
	breps: &HashMap<String, Vec<u8>>,
	bucket_memo: &ngoni::s3::S3Storage,
) -> Result<Vec<u8>, String> {
	// ShapeNodeのJSONをRFC 8785 (JCS) に従いsha256でキャッシュキーを生成
	let json_str = serde_json_canonicalizer::to_string(node).map_err(|e| e.to_string())?;
	let hash = {
		let mut h = Sha256::new();
		h.update(json_str.as_bytes());
		format!("{:x}", h.finalize())
	};
	let glb_key = format!("{}.glb", hash);

	// キャッシュヒットチェック
	if let Ok((_meta, data)) = bucket_memo.read(&glb_key).await {
		return Ok(data);
	}

	// キャッシュミス: shape()でGLBを計算してbucket_memoに保存
	let glb = shape(node, breps)?;
	bucket_memo
		.write(
			&glb_key,
			glb.clone(),
			Some("model/gltf-binary".to_string()),
			None,
			None,
		)
		.await
		.map_err(|e| format!("Failed to write GLB to bucket_memo: {}", e))?;

	Ok(glb)
}

/// ShapeNodeからOpenCASCADE ShapeへGLBバイト列を生成する。
/// 現時点ではStepNodeのみサポート。
fn shape(node: &ShapeNode, breps: &HashMap<String, Vec<u8>>) -> Result<Vec<u8>, String> {
	match node {
		ShapeNode::Step(step) => {
			let sha256 = &step.path;
			let brep_data = breps
				.get(sha256)
				.ok_or_else(|| format!("BRep data for '{}' not found in collected map", sha256))?;

			// BRepバイトをtmpファイルに書き出してopencascadeで読み込む
			let tmp_path = std::env::temp_dir().join(format!("{}.brep", sha256));
			std::fs::write(&tmp_path, brep_data)
				.map_err(|e| format!("Failed to write temp brep file: {}", e))?;

			let shape_result = Shape::read_brep(&tmp_path)
				.or_else(|_| Shape::read_brep_bin(&tmp_path))
				.map_err(|e| format!("Failed to read brep: {:?}", e));

			let _ = std::fs::remove_file(&tmp_path);
			let shape = shape_result?;

			let mesh = shape
				.mesh_with_tolerance(0.1)
				.map_err(|e| format!("mesh_with_tolerance failed: {:?}", e))?;

			create_glb(&mesh, &shape)
		}
		_ => Err("Only StepNode is currently supported".to_string()),
	}
}

/// GLB (GLTF Binary) を生成する。フラット法線 + エッジデータ付き。
pub fn create_glb(mesh: &opencascade::mesh::Mesh, shape: &Shape) -> Result<Vec<u8>, String> {
	use json::validation::Checked::Valid;

	// De-index the mesh and compute per-face (flat) normals
	let src_verts: Vec<[f32; 3]> = mesh
		.vertices
		.iter()
		.map(|v| [v.x as f32, v.y as f32, v.z as f32])
		.collect();

	let tri_count = mesh.indices.len() / 3;
	let vert_count = tri_count * 3;

	let mut flat_vertices: Vec<[f32; 3]> = Vec::with_capacity(vert_count);
	let mut flat_normals: Vec<[f32; 3]> = Vec::with_capacity(vert_count);

	for tri in 0..tri_count {
		let i0 = mesh.indices[tri * 3] as usize;
		let i1 = mesh.indices[tri * 3 + 1] as usize;
		let i2 = mesh.indices[tri * 3 + 2] as usize;

		let v0 = src_verts[i0];
		let v1 = src_verts[i1];
		let v2 = src_verts[i2];

		let edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
		let edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
		let nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
		let ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
		let nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];
		let len = (nx * nx + ny * ny + nz * nz).sqrt();
		let normal = if len > 1e-10 {
			[nx / len, ny / len, nz / len]
		} else {
			[0.0, 1.0, 0.0]
		};

		flat_vertices.push(v0);
		flat_vertices.push(v1);
		flat_vertices.push(v2);
		flat_normals.push(normal);
		flat_normals.push(normal);
		flat_normals.push(normal);
	}

	let v_bytes = unsafe {
		std::slice::from_raw_parts(
			flat_vertices.as_ptr() as *const u8,
			flat_vertices.len() * 12,
		)
	};
	let n_bytes = unsafe {
		std::slice::from_raw_parts(flat_normals.as_ptr() as *const u8, flat_normals.len() * 12)
	};

	let mut buffer = Vec::new();
	buffer.extend_from_slice(v_bytes);
	let v_offset = 0;
	let v_len = v_bytes.len();

	while buffer.len() % 4 != 0 {
		buffer.push(0);
	}
	let n_offset = buffer.len();
	buffer.extend_from_slice(n_bytes);
	let n_len = n_bytes.len();

	let buffer_total_len = buffer.len();

	// Extract edges from shape
	let mut edge_data: Vec<f32> = Vec::new();
	for edge in shape.edges() {
		let segments: Vec<_> = edge.approximation_segments().collect();
		if segments.len() < 2 {
			continue;
		}
		for i in 0..segments.len() - 1 {
			let start = segments[i];
			let end = segments[i + 1];
			edge_data.push(start.x as f32);
			edge_data.push(start.y as f32);
			edge_data.push(start.z as f32);
			edge_data.push(end.x as f32);
			edge_data.push(end.y as f32);
			edge_data.push(end.z as f32);
		}
	}

	let mut root = json::Root::default();
	root.buffers.push(json::Buffer {
		byte_length: json::validation::USize64(buffer_total_len as u64),
		name: None,
		uri: None,
		extensions: None,
		extras: Default::default(),
	});

	root.buffer_views.push(json::buffer::View {
		buffer: json::Index::new(0),
		byte_length: json::validation::USize64(v_len as u64),
		byte_offset: Some(json::validation::USize64(v_offset as u64)),
		byte_stride: None,
		name: None,
		target: Some(Valid(json::buffer::Target::ArrayBuffer)),
		extensions: None,
		extras: Default::default(),
	});
	root.accessors.push(json::Accessor {
		buffer_view: Some(json::Index::new(0)),
		byte_offset: Some(json::validation::USize64(0)),
		count: json::validation::USize64(flat_vertices.len() as u64),
		component_type: Valid(json::accessor::GenericComponentType(
			json::accessor::ComponentType::F32,
		)),
		extensions: None,
		extras: Default::default(),
		type_: Valid(json::accessor::Type::Vec3),
		min: None,
		max: None,
		name: None,
		normalized: false,
		sparse: None,
	});

	root.buffer_views.push(json::buffer::View {
		buffer: json::Index::new(0),
		byte_length: json::validation::USize64(n_len as u64),
		byte_offset: Some(json::validation::USize64(n_offset as u64)),
		byte_stride: None,
		name: None,
		target: Some(Valid(json::buffer::Target::ArrayBuffer)),
		extensions: None,
		extras: Default::default(),
	});
	root.accessors.push(json::Accessor {
		buffer_view: Some(json::Index::new(1)),
		byte_offset: Some(json::validation::USize64(0)),
		count: json::validation::USize64(flat_normals.len() as u64),
		component_type: Valid(json::accessor::GenericComponentType(
			json::accessor::ComponentType::F32,
		)),
		extensions: None,
		extras: Default::default(),
		type_: Valid(json::accessor::Type::Vec3),
		min: None,
		max: None,
		name: None,
		normalized: false,
		sparse: None,
	});

	let primitive = json::mesh::Primitive {
		attributes: {
			let mut map = std::collections::BTreeMap::new();
			map.insert(Valid(json::mesh::Semantic::Positions), json::Index::new(0));
			map.insert(Valid(json::mesh::Semantic::Normals), json::Index::new(1));
			map
		},
		extensions: None,
		extras: Default::default(),
		indices: None,
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

	let node_extras: json::extras::Extras = if !edge_data.is_empty() {
		let edges_json = serde_json::json!({ "edges": edge_data });
		let raw = serde_json::value::RawValue::from_string(
			serde_json::to_string(&edges_json).map_err(|e| e.to_string())?,
		)
		.map_err(|e| e.to_string())?;
		Some(raw)
	} else {
		None
	};

	root.nodes.push(json::Node {
		mesh: Some(json::Index::new(0)),
		extras: node_extras,
		..Default::default()
	});

	let scene = json::Scene {
		extensions: None,
		extras: Default::default(),
		name: None,
		nodes: vec![json::Index::new(0)],
	};
	root.scenes.push(scene);
	root.scene = Some(json::Index::new(0));

	let json_string = json::serialize::to_string(&root).map_err(|e| e.to_string())?;
	let mut json_bytes = json_string.into_bytes();
	while json_bytes.len() % 4 != 0 {
		json_bytes.push(b' ');
	}

	let mut glb = Vec::new();
	glb.write_all(b"glTF").unwrap();
	glb.write_all(&2u32.to_le_bytes()).unwrap();

	let total_size = 12 + 8 + json_bytes.len() + 8 + buffer.len();
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
	use super::*;

	/// cargo test の作業ディレクトリは api/ (Cargo.toml のある場所)
	const TEST_BREP_PATH: &str = "../public/PA-001-DF7.brep";
	const TEST_KEY: &str = "test_brep_sha256";

	fn load_test_brep() -> Vec<u8> {
		std::fs::read(TEST_BREP_PATH)
			.expect("テスト用BRepファイルが見つかりません: ../public/PA-001-DF7.brep")
	}

	fn step_node(key: &str) -> ShapeNode {
		ShapeNode::Step(StepNode {
			path: key.to_string(),
			content_hash: None,
		})
	}

	#[test]
	fn shape_step_node_returns_glb() {
		let mut breps = HashMap::new();
		breps.insert(TEST_KEY.to_string(), load_test_brep());

		let result = shape(&step_node(TEST_KEY), &breps);
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
		let breps = HashMap::new();

		let result = shape(&step_node("nonexistent"), &breps);
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
		let mut breps = HashMap::new();
		breps.insert(TEST_KEY.to_string(), load_test_brep());

		let glb = shape(&step_node(TEST_KEY), &breps).expect("GLBの生成に失敗しました");
		std::fs::write("../public/PA-001-DF7.glb", &glb)
			.expect("GLBファイルの書き込みに失敗しました");
		println!("生成完了: ../public/PA-001-DF7.glb ({} bytes)", glb.len());
	}

	#[test]
	fn shape_unsupported_node_returns_err() {
		let breps = HashMap::new();

		let node = ShapeNode::Union(UnionShapeNode {
			a: Box::new(step_node("a")),
			b: Box::new(step_node("b")),
		});

		let result = shape(&node, &breps);
		assert!(result.is_err());
		assert!(
			result.unwrap_err().contains("Only StepNode"),
			"エラーメッセージに 'Only StepNode' が含まれるべき"
		);
	}
}
