use chijin::{Error, Shape};
use glam::DVec3;

/// 切断面フェイスの Compound を delta 方向に押し出してフィラーを作ります。
/// BooleanShape::new_faces から直接フェイスを受け取るため、
/// heuristic による法線・重心フィルタは不要です。
fn extrude_faces(cut_faces: &Shape, delta: DVec3) -> Result<Shape, Error> {
	let mut filler: Option<Shape> = None;
	for face in cut_faces.faces() {
		let extruded = Shape::from(face.extrude(delta)?);
		filler = Some(match filler {
			None => extruded,
			Some(f) => Shape::from(f.union(&extruded)?),
		});
	}
	Ok(filler.unwrap_or_else(Shape::empty))
}

/// 指定された座標とベクトルで形状を分割し、片方を平行移動させた後、隙間を押し出し形状で埋めることで引き伸ばしを行います。
/// intersect の BooleanShape::new_faces から切断面を直接取得するため、
/// 法線・重心による heuristic フィルタを使いません。
fn stretch_vector(shape: &Shape, origin: DVec3, delta: DVec3) -> Result<Shape, Error> {
	let half = Shape::half_space(origin, delta.normalize());

	let intersect_result = shape.intersect(&half)?;
	let part_neg = intersect_result.shape;
	let cut_faces = intersect_result.new_faces;
	let part_pos = Shape::from(shape.subtract(&half)?).translated(delta);

	let filler = extrude_faces(&cut_faces, delta)?;
	let combined = Shape::from(part_neg.union(&filler)?);
	combined.union(&part_pos).map(Shape::from)
}

/// 形状をX, Y, Zの各軸方向に順番に引き伸ばします。
pub fn stretch(
	shape: &Shape,
	cx: f64,
	cy: f64,
	cz: f64,
	dx: f64,
	dy: f64,
	dz: f64,
) -> Result<Shape, Error> {
	let eps = 1e-10;
	let origin = DVec3::new(cx, cy, cz);

	let x;
	let after_x: &Shape = if dx > eps {
		x = stretch_vector(shape, origin, DVec3::new(dx, 0.0, 0.0))?;
		&x
	} else {
		shape
	};

	let y;
	let after_y: &Shape = if dy > eps {
		y = stretch_vector(after_x, origin, DVec3::new(0.0, dy, 0.0))?;
		&y
	} else {
		after_x
	};

	let z;
	let after_z: &Shape = if dz > eps {
		z = stretch_vector(after_y, origin, DVec3::new(0.0, 0.0, dz))?;
		&z
	} else {
		after_y
	};

	after_z.clean()
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::shape_to_glb::create_glb;
	use chijin::Shape;
	use glam::dvec3;

	const TEST_STEP_PATH: &str = "../public/LAMBDA360-BOX-d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951.step";

	fn load_step() -> Shape {
		let data = std::fs::read(TEST_STEP_PATH).expect("STEPファイルが見つかりません");
		Shape::read_step(&mut std::io::Cursor::new(data)).expect("STEPファイルの読み込みに失敗")
	}

	/// シンプルなボックスを生成（100x80x60mm、原点中心付近）
	fn make_box() -> Shape {
		Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0))
	}

	/// メッシュの bounding box 中心を返す
	fn bbox_center(mesh: &chijin::Mesh) -> glam::DVec3 {
		let (mut min, mut max) = (glam::DVec3::splat(f64::MAX), glam::DVec3::splat(f64::MIN));
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
		let stretched =
			stretch(&make_box(), 50.0, 40.0, 30.0, 50.0, 0.0, 0.0).expect("stretch failed");
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

		let result = stretch(&make_box(), 50.0, 40.0, 30.0, 0.0, 0.0, 0.0).expect("stretch failed");
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

		let result =
			stretch(&make_box(), 50.0, 40.0, 30.0, -50.0, -30.0, -10.0).expect("stretch failed");
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
	#[ignore = "manual: requires STEP file and ../out/ directory"]
	fn generate_stretched_glb() {
		let shape = load_step();
		let pre_mesh = shape.mesh_with_tolerance(0.1).expect("mesh failed");
		let center = bbox_center(&pre_mesh);
		let center = glam::DVec3::default();
		println!("STEP読み込み完了, bbox center = {:?}", center);

		// X軸方向に100mm、Z軸方向に50mm引き伸ばす
		let stretched = stretch(&load_step(), center.x, center.y, center.z, 10.0, 0.0, 0.0)
			.expect("stretch failed");
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

	/// 既知のバグ（C++レイヤーで Standard_OutOfRange 例外が発生しクラッシュする）の再現用ケース
	/// ユーザー報告の `cut: [100, 100, 75]` などを指定するとクラッシュする想定。
	/// テストランナーごと落ちるため、通常は実行対象から外す（ignore）。
	/// 実行確認用コマンド: cargo test stretch_known_error_case_100_100_75 -- --ignored --nocapture
	#[test]
	fn stretch_known_error_case_1_0_1() {
		let shape = load_step();
		let (cx, cy, cz) = (1.0, 0.0, 1.0);
		let (dx, dy, dz) = (1.0, 1.0, 1.0);
		println!("Running stretch_known_error_case_1_0_1. This might abort...");
		stretch(&shape, cx, cy, cz, dx, dy, dz).expect("stretch failed");
	}

	/// [1, 0, 10] を指定した場合のテストケース
	/// 実行確認用コマンド: cargo test stretch_test_1_0_10 -- --ignored --nocapture
	#[test]
	fn stretch_test_1_0_10() {
		let shape = load_step();

		// cut: [1, 0, 10]
		let (cx, cy, cz) = (10.0, 10.0, 10.0);
		let (dx, dy, dz) = (10.0, 0.0, 0.0);

		println!("Running stretch_test_1_0_10...");
		let _result = stretch(&shape, cx, cy, cz, dx, dy, dz).unwrap();
		println!("Finished successfully!");
	}

	// -------------------------------------------------------------------------
	// STATUS_HEAP_CORRUPTION 最小再現テスト群（外部 STEP ファイル不要）
	// -------------------------------------------------------------------------

	/// 【回帰①】stretch_test_1_0_10 と同じパラメータを Box で試す
	/// deep_copy 導入後はクラッシュせずに完走することを確認する。
	#[test]
	fn heap_corruption_box_same_params() {
		let shape = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		println!("stretch 開始");
		let _result = stretch(&shape, 1.0, 0.0, 10.0, 10.0, 0.0, 0.0);
		println!("Drop 直前");
		// _result がここで drop → STATUS_HEAP_CORRUPTION が発生するか観察
	}

	/// 【再現②】stretch を経由せず Boolean 演算チェーンを直接組む
	/// intersect → subtract → union（フィラー付き）→ clean の最小構成。
	/// stretch 内のどの操作が引き金かを特定するための最小ケース。
	/// cargo test heap_corruption_direct_bool_chain -- --ignored --nocapture
	#[test]
	#[ignore = "STATUS_HEAP_CORRUPTION 再現用（プロセス終了時クラッシュ想定）"]
	fn heap_corruption_direct_bool_chain() {
		let big = 10_000.0_f64;
		let cut_x = 50.0_f64;
		let delta = 20.0_f64;

		let shape = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		let cutter = Shape::box_from_corners(dvec3(cut_x, -big, -big), dvec3(big, big, big));

		// stretch_axis(axis=X) の内部と同じ操作列
		let mut pos_half = Shape::from(shape.intersect(&cutter).unwrap());
		let neg_half = Shape::from(shape.subtract(&cutter).unwrap());
		pos_half.set_global_translation(dvec3(delta, 0.0, 0.0));

		// フィラー（平行移動で生じたギャップを埋めるボックス）
		let filler =
			Shape::box_from_corners(dvec3(cut_x, 0.0, 0.0), dvec3(cut_x + delta, 80.0, 60.0));

		let pre_merged = Shape::from(neg_half.union(&filler).unwrap());
		let merged = Shape::from(pre_merged.union(&pos_half).unwrap());
		let _result = merged.clean();

		println!("Drop 直前");
		// _result / merged / filler / pos_half / neg_half / cutter が順に drop
		// → STATUS_HEAP_CORRUPTION が発生するか観察
	}

	/// 【再現③】cutter を early drop して ACCESS_VIOLATION を再現する
	/// 「結果 Shape が入力の生ポインタを保持している」仮説の直接的な検証。
	/// STATUS_ACCESS_VIOLATION (0xc0000005) になれば仮説が確定する。
	/// cargo test heap_corruption_early_drop -- --ignored --nocapture
	#[test]
	#[ignore = "STATUS_ACCESS_VIOLATION 再現用（early drop 実験）"]
	fn heap_corruption_early_drop() {
		let big = 10_000.0_f64;
		let cut_x = 50.0_f64;
		let delta = 20.0_f64;

		let shape = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		let cutter = Shape::box_from_corners(dvec3(cut_x, -big, -big), dvec3(big, big, big));

		let mut pos_half = Shape::from(shape.intersect(&cutter).unwrap());
		let neg_half = Shape::from(shape.subtract(&cutter).unwrap());

		drop(cutter); // ← 入力の早期解放 → ACCESS_VIOLATION が起きるか観察

		pos_half.set_global_translation(dvec3(delta, 0.0, 0.0));

		let filler =
			Shape::box_from_corners(dvec3(cut_x, 0.0, 0.0), dvec3(cut_x + delta, 80.0, 60.0));
		let pre_merged = Shape::from(neg_half.union(&filler).unwrap());
		let _result = Shape::from(pre_merged.union(&pos_half).unwrap());

		println!("もし表示されたら early drop による ACCESS_VIOLATION は起きなかった");
	}

	/// 【回帰④】L字断面形状（union で接合面を作り extrude_cut_faces を起動させる）
	/// deep_copy 導入後は extrude_cut_faces → filler union の経路でもクラッシュしないことを確認する。
	#[test]
	fn heap_corruption_l_shape() {
		// box_a の右面 (x=100) が cut 座標の面になる
		let box_a = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		// box_b を結合して x=100 の面を L字に（一部だけ埋める）
		let box_b = Shape::box_from_corners(dvec3(100.0, 0.0, 0.0), dvec3(150.0, 50.0, 40.0));
		let shape = Shape::from(box_a.union(&box_b).unwrap());

		// x=100 の面（L字残余部分）が extrude_cut_faces にマッチする
		println!("stretch 開始");
		let _result = stretch(&shape, 100.0, 0.0, 0.0, 20.0, 0.0, 0.0);
		println!("Drop 直前");
	}

	/// 【回帰⑤】シリンダー穴あきボックス（曲面トポロジーを含む複合形状）
	/// deep_copy 導入後は曲面を含む複合形状でもクラッシュしないことを確認する。
	#[test]
	fn heap_corruption_cylinder_hole() {
		use glam::DVec3;
		let box_shape = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		// Z方向に貫通するシリンダーで穴を開ける（曲面＋円形エッジが生まれる）
		let hole = Shape::cylinder(dvec3(50.0, 40.0, -1.0), 15.0, DVec3::Z, 62.0);
		let shape = Shape::from(box_shape.subtract(&hole).unwrap());

		println!("stretch 開始");
		let _result = stretch(&shape, 50.0, 40.0, 30.0, 20.0, 0.0, 0.0);
		println!("Drop 直前");
	}
}
