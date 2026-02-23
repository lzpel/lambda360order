use crate::openapi::*;
use crate::shape_stretch::shape_stretch;
use crate::shape_to_glb::create_glb;
use ngoni;
use opencascade::primitives::Shape;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// NumberOrExpr::Variant0(f64) を f64 に変換する。Variant1(String) は未サポート。
fn resolve_number(expr: &NumberOrExpr) -> Result<f64, String> {
	match expr {
		NumberOrExpr::Variant0(v) => Ok(*v),
		NumberOrExpr::Variant1(s) => Err(format!("Expression '{}' is not supported", s)),
	}
}

/// Vec<NumberOrExpr> の先頭3要素を [f64; 3] に変換する。
fn resolve_vec3(v: &[NumberOrExpr]) -> Result<[f64; 3], String> {
	if v.len() != 3 {
		return Err(format!("Expected 3 elements, got {}", v.len()));
	}
	Ok([
		resolve_number(&v[0])?,
		resolve_number(&v[1])?,
		resolve_number(&v[2])?,
	])
}

/// ShapeNodeのstep命令を再帰的に収集し、必要なbrepファイルをHashMapにまとめる。
/// StepNode.pathはフロントエンドがSTEPファイルのsha256に置換済み。
/// bucket_memoに `{sha256}` （拡張子なし）が存在しなければエラーを返す（アップロード/変換未完了）。
///
/// Phase 1: ShapeNodeを再帰的に走査してsha256キーをHashSetに収集（同期）
/// Phase 2: HashSetのキーを元にbucket_mainから並列ダウンロード
/// Phase 3: spawn_blockingで並列にBREPを読み込みHashMap<String, Shape>に格納
pub async fn collect_shape(
	node: &ShapeNode,
	bucket_main: &ngoni::s3::S3Storage,
) -> Result<HashMap<String, Shape>, String> {
	// Phase 1: sha256キーの収集（重複排除）
	let mut keys = std::collections::HashSet::new();
	collect_keys(node, &mut keys);

	// Phase 2: 並列ダウンロード
	let futures = keys.into_iter().map(|sha256| async move {
		let key = format!("{}", sha256);
		match bucket_main.read(&key).await {
			Ok((_meta, data)) => Ok((sha256, data)),
			Err(_) => Err(format!(
				"BRep for '{}' not found in main bucket; STEP upload/conversion may be incomplete.",
				sha256
			)),
		}
	});
	let pairs = futures_util::future::try_join_all(futures).await?;

	// Phase 3: spawn_blockingで並列BREP読み込み（TopoDS_Shape: Send）
	let handles: Vec<_> = pairs
		.into_iter()
		.map(|(sha256, data)| {
			tokio::task::spawn_blocking(move || {
				let tmp = std::env::temp_dir().join(format!("{}.brep", sha256));
				std::fs::write(&tmp, &data)
					.map_err(|e| format!("Failed to write temp brep: {}", e))?;
				let shape = Shape::read_brep(&tmp)
					.or_else(|_| Shape::read_brep_bin(&tmp))
					.map_err(|e| format!("Failed to read brep '{}': {:?}", sha256, e));
				let _ = std::fs::remove_file(&tmp);
				Ok::<_, String>((sha256, shape?))
			})
		})
		.collect();

	let mut shapes = HashMap::new();
	for handle in handles {
		let (sha256, shape) = handle
			.await
			.map_err(|e| format!("spawn_blocking join error: {}", e))??;
		shapes.insert(sha256, shape);
	}
	Ok(shapes)
}

/// ShapeNodeを再帰的に走査してStepNodeのsha256キーをHashSetに収集する（同期）
fn collect_keys(node: &ShapeNode, keys: &mut std::collections::HashSet<String>) {
	match node {
		ShapeNode::Step(step) => {
			keys.insert(step.content_hash.clone());
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

/// ShapeNodeを再帰的に走査してStepNodeのdescriptionをNoneに設定する（同期）
/// cached_shape()でdescriptionをキャッシュキーに含めないために使用する
fn strip_descriptions(node: &mut ShapeNode) {
	match node {
		ShapeNode::Step(step) => {
			step.description = None;
		}
		ShapeNode::Union(n) => {
			strip_descriptions(&mut n.a);
			strip_descriptions(&mut n.b);
		}
		ShapeNode::Intersect(n) => {
			strip_descriptions(&mut n.a);
			strip_descriptions(&mut n.b);
		}
		ShapeNode::Subtract(n) => {
			strip_descriptions(&mut n.a);
			strip_descriptions(&mut n.b);
		}
		ShapeNode::Scale(n) => {
			strip_descriptions(&mut n.shape);
		}
		ShapeNode::Translate(n) => {
			strip_descriptions(&mut n.shape);
		}
		ShapeNode::Rotate(n) => {
			strip_descriptions(&mut n.shape);
		}
		ShapeNode::Stretch(n) => {
			strip_descriptions(&mut n.shape);
		}
	}
}

/// ShapeNodeのJSONをsha256にしてbucket_memoをチェックし、キャッシュヒットならGLBを返す。
/// キャッシュミスの場合はshape()でGLBを計算して保存してから返す。
/// shapes は eval_shape で消費される（cache miss 時のみ）。
pub async fn cached_shape(
	node: &ShapeNode,
	shapes: HashMap<String, Shape>,
	bucket_temp: &ngoni::s3::S3Storage,
) -> Result<Vec<u8>, String> {
	// descriptionを除いたShapeNodeのJSONをRFC 8785 (JCS) に従いsha256でキャッシュキーを生成
	let mut node_for_hash = node.clone();
	strip_descriptions(&mut node_for_hash);
	let json_str =
		serde_json_canonicalizer::to_string(&node_for_hash).map_err(|e| e.to_string())?;
	let hash = {
		let mut h = Sha256::new();
		h.update(json_str.as_bytes());
		format!("{:x}", h.finalize())
	};
	let glb_key = format!("{}", hash);

	// キャッシュヒットチェック（bucket_temp）
	if let Ok((_meta, data)) = bucket_temp.read(&glb_key).await {
		return Ok(data);
	}

	// キャッシュミス: shape()でGLBを計算してbucket_tempに保存
	let glb = shape(node, shapes)?;
	bucket_temp
		.write(
			&glb_key,
			glb.clone(),
			Some("model/gltf-binary".to_string()),
			None,
			None,
		)
		.await
		.map_err(|e| format!("Failed to write GLB to bucket_temp: {}", e))?;

	Ok(glb)
}

/// ShapeNodeからOCC Shapeを再帰的に構築し、GLBバイト列を返す。
pub(crate) fn shape(node: &ShapeNode, shapes: HashMap<String, Shape>) -> Result<Vec<u8>, String> {
	let mut shapes = shapes;
	let occ_shape = eval_shape(node, &mut shapes)?;
	let mesh = occ_shape
		.mesh_with_tolerance(0.1)
		.map_err(|e| format!("mesh_with_tolerance failed: {:?}", e))?;
	create_glb(&mesh, &occ_shape)
}

/// ShapeNodeを再帰的に評価してOCC Shapeを返す。
/// shapes から StepNode の Shape を取り出す（remove）ため &mut を要求する。
fn eval_shape(node: &ShapeNode, shapes: &mut HashMap<String, Shape>) -> Result<Shape, String> {
	match node {
		ShapeNode::Step(step) => {
			let sha256 = &step.content_hash;
			shapes
				.remove(sha256)
				.ok_or_else(|| format!("Shape data for '{}' not found in collected map", sha256))
		}
		ShapeNode::Stretch(n) => {
			let [cx, cy, cz] = resolve_vec3(&n.cut)?;
			let [dx, dy, dz] = resolve_vec3(&n.delta)?;
			let child = eval_shape(&n.shape, shapes)?;
			shape_stretch(child, cx, cy, cz, dx, dy, dz)
		}
		_ => Err("Only StepNode and StretchNode are currently supported".to_string()),
	}
}
