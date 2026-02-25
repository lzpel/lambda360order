use glam::dvec3;
use opencascade::primitives::Shape;

/// 大箱の半辺長（半空間代用）
const BIG: f64 = 10_000.0;

/// 切断面の検出しきい値
const NORMAL_THRESHOLD: f64 = 0.99;
const COORD_TOLERANCE: f64 = 0.1;

/// part_neg の切断面（指定軸の座標 ≈ cut_coord かつ法線が軸に垂直な Face）を
/// 見つけて delta だけ押し出し、フィラーソリッドを生成する。
/// 複数 Face がマッチした場合は union で結合する。
fn extrude_cut_faces(half: &Shape, axis: usize, cut_coord: f64, delta: f64) -> Shape {
	let extrude_dir = match axis {
		0 => dvec3(delta, 0.0, 0.0),
		1 => dvec3(0.0, delta, 0.0),
		_ => dvec3(0.0, 0.0, delta),
	};

	let mut filler: Option<Shape> = None;
	for face in half.faces() {
		let normal = face.normal_at_center();
		let center = face.center_of_mass();

		let n_component = match axis {
			0 => normal.x,
			1 => normal.y,
			_ => normal.z,
		};
		let c_component = match axis {
			0 => center.x,
			1 => center.y,
			_ => center.z,
		};

		if n_component.abs() > NORMAL_THRESHOLD && (c_component - cut_coord).abs() < COORD_TOLERANCE
		{
			let extruded = Shape::from(face.extrude(extrude_dir));
			filler = Some(match filler {
				None => extruded,
				Some(f) => f.union(&extruded).shape,
			});
		}
	}
	filler.unwrap_or_else(Shape::empty)
}

/// 1軸分の切断+移動+ギャップ充填を行う。
/// axis: 0=X, 1=Y, 2=Z
fn stretch_axis(shape: Shape, axis: usize, cut_coord: f64, delta: f64) -> Shape {
	if delta <= 1e-10 {
		return shape;
	}

	let (corner_min, corner_max) = match axis {
		0 => (dvec3(cut_coord, -BIG, -BIG), dvec3(BIG, BIG, BIG)),
		1 => (dvec3(-BIG, cut_coord, -BIG), dvec3(BIG, BIG, BIG)),
		_ => (dvec3(-BIG, -BIG, cut_coord), dvec3(BIG, BIG, BIG)),
	};

	let translation = match axis {
		0 => dvec3(delta, 0.0, 0.0),
		1 => dvec3(0.0, delta, 0.0),
		_ => dvec3(0.0, 0.0, delta),
	};

	let half_pos = Shape::box_from_corners(corner_min, corner_max);
	let mut part_pos = shape.intersect(&half_pos).shape;
	let part_neg = shape.subtract(&half_pos).shape;
	part_pos.set_global_translation(translation);

	// 切断面を押し出してフィラーを生成
	let filler = extrude_cut_faces(&part_neg, axis, cut_coord, delta);

	part_neg.union(&filler).shape.union(&part_pos).shape
}

/// StretchNode の実装: x/y/z 軸ごとに独立した軸平行な切断+移動+ギャップ充填を行う。
///
/// cut = [cx, cy, cz]: 各軸の切断座標 (mm)
/// delta = [dx, dy, dz]: 各軸方向の伸縮量 (mm)。負は無視（max(0, d) に変換）。
///
/// 各軸について d > 0 の場合のみ処理する:
///   1. 大箱で半空間を近似して切断（intersect / subtract）
///   2. 正側を d だけ平行移動
///   3. 負側の切断面 Face を d だけ押し出してフィラーソリッドを生成
///   4. 負側 ＋ フィラー ＋ 正側 を union して隙間を埋める
pub fn shape_stretch(
	shape: Shape,
	cx: f64,
	cy: f64,
	cz: f64,
	dx: f64,
	dy: f64,
	dz: f64,
) -> Result<Shape, String> {
	let dx = dx.max(0.0);
	let dy = dy.max(0.0);
	let dz = dz.max(0.0);

	let shape_new = stretch_axis(shape, 0, cx, dx);
	let shape_new = stretch_axis(shape_new, 1, cy, dy);
	let shape_new = stretch_axis(shape_new, 2, cz, dz);

	let did_stretch = dx > 1e-10 || dy > 1e-10 || dz > 1e-10;
	Ok(if did_stretch {
		shape_new.clean()
	} else {
		shape_new
	})
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::shape_to_glb::create_glb;
	use glam::DVec3;
	use opencascade::primitives::Shape;

	const TEST_STEP_PATH: &str = "../public/LAMBDA360-BOX-d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951.step";

	fn load_step() -> Shape {
		Shape::read_step(TEST_STEP_PATH).expect("STEPファイルが見つかりません")
	}

	/// シンプルなボックスを生成（100x80x60mm、原点中心付近）
	fn make_box() -> Shape {
		Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0))
	}

	/// メッシュの bounding box 中心を返す
	fn bbox_center(mesh: &opencascade::mesh::Mesh) -> DVec3 {
		let (mut min, mut max) = (DVec3::splat(f64::MAX), DVec3::splat(f64::MIN));
		for v in &mesh.vertices {
			min = min.min(*v);
			max = max.max(*v);
		}
		(min + max) * 0.5
	}

	/// ボックスをX軸方向に50mm伸ばす → 有効なメッシュが得られる
	/// cargo test -- stretch_box_x_axis --nocapture
	#[test]
	fn stretch_box_x_axis() {
		let shape = make_box();
		let original_mesh = shape
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on original");

		// ボックス中央 (50,40,30) で切断して X 方向に 50mm 引き伸ばす
		let stretched = shape_stretch(make_box(), 50.0, 40.0, 30.0, 50.0, 0.0, 0.0)
			.expect("shape_stretch failed");
		let stretched_mesh = stretched
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on stretched");

		assert!(
			!stretched_mesh.vertices.is_empty(),
			"ストレッチ後に有効なメッシュが生成されるべき"
		);
		println!(
			"original verts={}, stretched verts={}",
			original_mesh.vertices.len(),
			stretched_mesh.vertices.len()
		);
	}

	/// delta=(0,0,0) はノーオペ → 頂点数が同じ
	#[test]
	fn stretch_zero_delta_is_noop() {
		let shape = make_box();
		let original_mesh = shape
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on original");
		let original_verts = original_mesh.vertices.len();

		let result = shape_stretch(make_box(), 50.0, 40.0, 30.0, 0.0, 0.0, 0.0)
			.expect("shape_stretch failed");
		let result_mesh = result
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on result");

		assert_eq!(
			result_mesh.vertices.len(),
			original_verts,
			"delta=0 なら頂点数が変わらないはず"
		);
	}

	/// 負の delta は max(0) にクランプされ、ノーオペになる
	#[test]
	fn stretch_negative_delta_clamped() {
		let shape = make_box();
		let original_mesh = shape
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on original");
		let original_verts = original_mesh.vertices.len();

		let result = shape_stretch(make_box(), 50.0, 40.0, 30.0, -50.0, -30.0, -10.0)
			.expect("shape_stretch failed");
		let result_mesh = result
			.mesh_with_tolerance(0.1)
			.expect("mesh failed on result");

		assert_eq!(
			result_mesh.vertices.len(),
			original_verts,
			"負のdeltaはクランプされてノーオペになるはず"
		);
	}

	/// LAMBDA360-BOX STEP を読み込み → ストレッチ → GLB 書き出し
	/// cargo test -- generate_stretched_glb --ignored --nocapture
	#[test]
	fn generate_stretched_glb() {
		let shape = load_step();
		let pre_mesh = shape.mesh_with_tolerance(0.1).expect("mesh failed");
		let center = bbox_center(&pre_mesh);
		let center = DVec3::default();
		println!("STEP読み込み完了, bbox center = {:?}", center);

		// X軸方向に100mm、Z軸方向に50mm引き伸ばす
		let stretched = shape_stretch(load_step(), center.x, center.y, center.z, 10.0, 0.0, 0.0)
			.expect("shape_stretch failed");
		println!("ストレッチ完了");

		let mesh = stretched
			.mesh_with_tolerance(0.1)
			.expect("mesh_with_tolerance failed");
		println!(
			"メッシュ生成完了: vertices={}, indices={}",
			mesh.vertices.len(),
			mesh.indices.len()
		);

		let glb = create_glb(&mesh, &stretched).expect("GLB生成失敗");
		let out_path = "../out/LAMBDA360-BOX-stretched.glb";
		std::fs::write(out_path, &glb).expect("GLB書き込み失敗");
		println!("生成完了: {} ({} bytes)", out_path, glb.len());
	}
}
