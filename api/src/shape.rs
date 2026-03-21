use crate::openapi::*;
use chijin::{Shape, utils::stretch_vector};
use glam::DVec3;
use ngoni;

use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::io::Cursor;

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

/// ShapeNodeからキャッシュのキーとなるSHA256ハッシュを計算する。
fn compute_shape_hash(node: &ShapeNode) -> Result<String, String> {
	let json_str = serde_json_canonicalizer::to_string(node).map_err(|e| e.to_string())?;
	let mut h = Sha256::new();
	h.update(json_str.as_bytes());
	Ok(format!("{:x}", h.finalize()))
}

/// bucket_tempのキャッシュからShapeを取得する。ヒットすればSome(Shape)、ミスはNone。
async fn shape_cached(node: &ShapeNode, bucket_temp: &ngoni::s3::S3Storage) -> Option<Shape> {
	let hash = compute_shape_hash(node).ok()?;
	let (_meta, data) = bucket_temp.read(&hash).await.ok()?;
	Shape::read_brep_color(&mut Cursor::new(&data))
		.or_else(|_| Shape::read_brep_bin(&mut Cursor::new(&data)))
		.or_else(|_| Shape::read_brep_text(&mut Cursor::new(&data)))
		.ok()
}

/// ShapeNodeのstep命令を再帰的に収集し、必要なbrepファイルをHashMapにまとめる。
///
/// Phase 1: ShapeNodeを再帰的に走査してsha256キーをHashSetに収集（同期）
/// Phase 2: HashSetのキーを元にbucket_mainから並列ダウンロード
/// Phase 3: spawn_blockingで並列にBREPを読み込みHashMap<String, Shape>に格納
async fn collect_shape(
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

	// Phase 3: spawn_blocking で並列 BRep 読み込み
	let handles: Vec<_> = pairs
		.into_iter()
		.map(|(sha256, data)| {
			tokio::task::spawn_blocking(move || {
				let shape = Shape::read_brep_color(&mut Cursor::new(&data))
					.or_else(|_| Shape::read_brep_bin(&mut Cursor::new(&data)))
					.or_else(|_| Shape::read_brep_text(&mut Cursor::new(&data)))
					.map_err(|e| format!("Failed to read brep '{}': {:?}", sha256, e))?;
				Ok::<_, String>((sha256, shape))
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
			for s in &n.shapes {
				collect_keys(s, keys);
			}
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

/// ShapeNodeを評価してShapeを返す。
/// キャッシュヒット時はbucket_tempから取得、ミス時はcollect_shape+eval_shapeで計算して保存。
pub async fn resolve_shape(
	node: &ShapeNode,
	bucket_main: &ngoni::s3::S3Storage,
	bucket_temp: &ngoni::s3::S3Storage,
) -> Result<Shape, String> {
	if let Some(s) = shape_cached(node, bucket_temp).await {
		return Ok(s);
	}

	let shapes = collect_shape(node, bucket_main).await?;
	let shape = eval_shape(node, &mut { shapes })?;

	// 結果をbucket_tempにキャッシュ（write_brep_color: 色メタデータ付きBRep）
	let hash = compute_shape_hash(node)?;
	let mut brep_buf = Vec::new();
	shape
		.write_brep_color(&mut brep_buf)
		.map_err(|e| format!("Failed to write BRep: {:?}", e))?;
	bucket_temp
		.write(
			&hash,
			brep_buf,
			Some("application/octet-stream".to_string()),
			None,
			None,
		)
		.await
		.map_err(|e| format!("Failed to cache shape: {}", e))?;

	Ok(shape)
}

/// ShapeNodeを再帰的に評価してShapeを返す。
/// shapes から StepNode の Shape を取り出す（remove）ため &mut を要求する。
pub(crate) fn eval_shape(
	node: &ShapeNode,
	shapes: &mut HashMap<String, Shape>,
) -> Result<Shape, String> {
	match node {
		ShapeNode::Step(step) => {
			let sha256 = &step.content_hash;
			shapes
				.remove(sha256)
				.ok_or_else(|| format!("Shape data for '{}' not found in collected map", sha256))
		}
		ShapeNode::Union(n) => {
			if n.shapes.is_empty() {
				return Err("Union requires at least one shape".to_string());
			}
			let mut iter = n.shapes.iter();
			let first = eval_shape(iter.next().unwrap(), shapes)?;
			iter.try_fold(first, |acc, s| {
				let next = eval_shape(s, shapes)?;
				acc.union(&next).map(Shape::from).map_err(|e| e.to_string())
			})
		}
		ShapeNode::Stretch(n) => {
			let [cx, cy, cz] = resolve_vec3(&n.cut)?;
			let [dx, dy, dz] = resolve_vec3(&n.delta)?;
			let child = eval_shape(&n.shape, shapes)?;
			let eps = 1e-10;
			let origin = DVec3::new(cx, cy, cz);
			let x;
			let after_x: &Shape = if dx > eps {
				x = stretch_vector(&child, origin, DVec3::new(dx, 0.0, 0.0))
					.map_err(|e| e.to_string())?;
				&x
			} else {
				&child
			};
			let y;
			let after_y: &Shape = if dy > eps {
				y = stretch_vector(after_x, origin, DVec3::new(0.0, dy, 0.0))
					.map_err(|e| e.to_string())?;
				&y
			} else {
				after_x
			};
			let z;
			let after_z: &Shape = if dz > eps {
				z = stretch_vector(after_y, origin, DVec3::new(0.0, 0.0, dz))
					.map_err(|e| e.to_string())?;
				&z
			} else {
				after_y
			};
			after_z.clean().map_err(|e| e.to_string())
		}
		_ => Err("Only StepNode and StretchNode are currently supported".to_string()),
	}
}

#[cfg(test)]
mod tests {
	use super::eval_shape;
	use crate::openapi::*;
	use chijin::Shape;
	use std::collections::HashMap;

	const TEST_BREP_PATH: &str = "examples/colored_box.brep";
	const TEST_KEY: &str = "test_brep_sha256";

	fn load_test_shape() -> Shape {
		let data = std::fs::read(TEST_BREP_PATH).expect(
			"テスト用BRepファイルが見つかりません。先に #[ignore] generate_brep を実行してください",
		);
		Shape::read_brep_color(&mut std::io::Cursor::new(&data))
			.or_else(|_| Shape::read_brep_bin(&mut std::io::Cursor::new(&data)))
			.or_else(|_| Shape::read_brep_text(&mut std::io::Cursor::new(&data)))
			.expect("テスト用BRepファイルが読み込めません")
	}

	fn shapes_map(key: &str) -> HashMap<String, Shape> {
		let mut m = HashMap::new();
		m.insert(key.to_string(), load_test_shape());
		m
	}

	fn step_node(key: &str) -> ShapeNode {
		ShapeNode::Step(StepNode {
			content_hash: key.to_string(),
		})
	}

	#[test]
	fn shape_step_node_returns_shape() {
		let result = eval_shape(&step_node(TEST_KEY), &mut shapes_map(TEST_KEY));
		assert!(
			result.is_ok(),
			"eval_shape() がエラーを返しました: {:?}",
			result.err()
		);
	}

	#[test]
	fn shape_missing_brep_returns_err() {
		let result = eval_shape(&step_node("nonexistent"), &mut HashMap::new());
		assert!(result.is_err());
		assert!(result.err().unwrap().contains("not found"));
	}
}
