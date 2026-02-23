use glam::dvec3;
use opencascade::primitives::Shape;

/// 大箱の半辺長（半空間代用）
const BIG: f64 = 10_000.0;

/// StretchNode の実装: x/y/z 軸ごとに独立した軸平行な切断+移動+ギャップ充填を行う。
///
/// cut = [cx, cy, cz]: 各軸の切断座標 (mm)
/// delta = [dx, dy, dz]: 各軸方向の伸縮量 (mm)。負は無視（max(0, d) に変換）。
///
/// 各軸について d > 0 の場合のみ処理する:
///   1. 切断前の shape で断面エッジを取得（BRepAlgoAPI_Section）
///   2. 大箱で半空間を近似して切断（intersect / subtract）
///   3. 正側を d だけ平行移動
///   4. 断面エッジから Wire → Face → 押し出しソリッド（コネクタ）を生成
///   5. 負側 ＋ コネクタ ＋ 正側 を union して隙間を埋める
///      （コネクタ生成失敗時は隙間なしで union するフォールバック）
pub fn shape_stretch(
	mut shape: Shape,
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

	// X軸方向: x > cx の部分を dx だけ +X 方向に移動
	if dx > 1e-10 {
		let half_pos = Shape::box_from_corners(dvec3(cx, -BIG, -BIG), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(dx, 0.0, 0.0));

		// ギャップ充填: cx..cx+dx の範囲を元の shape から intersect で切り出して引き伸ばす
		let gap_box = Shape::box_from_corners(dvec3(cx, -BIG, -BIG), dvec3(cx + dx, BIG, BIG));
		let filler = shape.intersect(&gap_box).shape;

		shape = part_neg.union(&filler).shape.union(&part_pos).shape;
	}

	// Y軸方向: y > cy の部分を dy だけ +Y 方向に移動
	if dy > 1e-10 {
		let half_pos = Shape::box_from_corners(dvec3(-BIG, cy, -BIG), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(0.0, dy, 0.0));

		let gap_box = Shape::box_from_corners(dvec3(-BIG, cy, -BIG), dvec3(BIG, cy + dy, BIG));
		let filler = shape.intersect(&gap_box).shape;

		shape = part_neg.union(&filler).shape.union(&part_pos).shape;
	}

	// Z軸方向: z > cz の部分を dz だけ +Z 方向に移動
	if dz > 1e-10 {
		let half_pos = Shape::box_from_corners(dvec3(-BIG, -BIG, cz), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(0.0, 0.0, dz));

		let gap_box = Shape::box_from_corners(dvec3(-BIG, -BIG, cz), dvec3(BIG, BIG, cz + dz));
		let filler = shape.intersect(&gap_box).shape;

		shape = part_neg.union(&filler).shape.union(&part_pos).shape;
	}

	Ok(shape)
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::shape_to_glb::create_glb;
	use glam::DVec3;
	use opencascade::primitives::Shape;

	const TEST_STEP_PATH: &str = "../public/LAMBDA360-BOX-89192879c0b7d7418e1ffcd3a15427829342dd052098696cf82c100a053b42a9.step";

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
	#[ignore]
	fn generate_stretched_glb() {
		let shape = load_step();
		let pre_mesh = shape.mesh_with_tolerance(0.1).expect("mesh failed");
		let center = bbox_center(&pre_mesh);
		println!("STEP読み込み完了, bbox center = {:?}", center);

		// X軸方向に100mm、Z軸方向に50mm引き伸ばす
		let stretched = shape_stretch(load_step(), center.x, center.y, center.z, 100.0, 0.0, 50.0)
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
		let out_path = "../public/LAMBDA360-BOX-stretched.glb";
		std::fs::write(out_path, &glb).expect("GLB書き込み失敗");
		println!("生成完了: {} ({} bytes)", out_path, glb.len());
	}
}
