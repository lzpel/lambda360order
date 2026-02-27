use glam::dvec3;
use opencascade::primitives::Shape;

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
			let extruded = Shape::from(face.extrude(extrude_dir)).deep_copy();
			filler = Some(match filler {
				None => extruded,
				Some(f) => f.union(&extruded).shape.deep_copy(),
			});
		}
	}
	filler.unwrap_or_else(Shape::empty)
}

/// 1軸分の切断+移動+ギャップ充填を行う。
/// axis: 0=X, 1=Y, 2=Z
fn stretch_axis(shape: Shape, axis: usize, cut_coord: f64, delta: f64) -> Shape {
	let (plane_origin, plane_normal) = match axis {
		0 => (dvec3(cut_coord, 0.0, 0.0), dvec3(1.0, 0.0, 0.0)),
		1 => (dvec3(0.0, cut_coord, 0.0), dvec3(0.0, 1.0, 0.0)),
		_ => (dvec3(0.0, 0.0, cut_coord), dvec3(0.0, 0.0, 1.0)),
	};

	let translation = match axis {
		0 => dvec3(delta, 0.0, 0.0),
		1 => dvec3(0.0, delta, 0.0),
		_ => dvec3(0.0, 0.0, delta),
	};

	let half_pos = Shape::half_space(plane_origin, plane_normal);
	let mut part_pos = shape.intersect(&half_pos).shape.deep_copy();
	let part_neg = shape.subtract(&half_pos).shape.deep_copy();
	part_pos.set_global_translation(translation);

	// 切断面を押し出してフィラーを生成
	let filler = extrude_cut_faces(&part_neg, axis, cut_coord, delta);

	part_neg.union(&filler).shape.union(&part_pos).shape.deep_copy()
}

/// StretchNode の実装: x/y/z 軸ごとに独立した軸平行な切断+移動+ギャップ充填を行う。
///
/// cut = [cx, cy, cz]: 各軸の切断座標 (mm)
/// delta = [dx, dy, dz]: 各軸方向の伸縮量 (mm)。負は無視（max(0, d) に変換）。
///
/// 各軸について d > 0 の場合のみ処理する:
///   1. BRepPrimAPI_MakeHalfSpace で無限半空間を生成して切断（intersect / subtract）
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
	let eps = 1e-10;
	let shape = if dx > eps {
		stretch_axis(shape, 0, cx, dx.max(0.0))
	} else {
		shape
	};
	let shape = if dy > eps {
		stretch_axis(shape, 1, cy, dy.max(0.0))
	} else {
		shape
	};
	let shape = if dz > eps {
		stretch_axis(shape, 2, cz, dz.max(0.0))
	} else {
		shape
	};
	Ok(if dx > eps || dy > eps || dz > eps {
		println!("cleaned");
		shape.clean().deep_copy()
	} else {
		shape
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
	#[ignore = "manual: requires STEP file and ../out/ directory"]
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

	/// 既知のバグ（C++レイヤーで Standard_OutOfRange 例外が発生しクラッシュする）の再現用ケース
	/// ユーザー報告の `cut: [100, 100, 75]` などを指定するとクラッシュする想定。
	/// テストランナーごと落ちるため、通常は実行対象から外す（ignore）。
	/// 実行確認用コマンド: cargo test stretch_known_error_case_100_100_75 -- --ignored --nocapture
	#[test]
	#[ignore = "causes C++ Standard_OutOfRange abort"]
	fn stretch_known_error_case_100_100_75() {
		let shape = load_step();

		// cut: [100, 100, 75]
		let (cx, cy, cz) = (100.0, 100.0, 75.0);
		// JSONの delta=["$width-200", ...] に相当する正の変位を適当に与える
		let (dx, dy, dz) = (10.0, 10.0, 10.0);

		println!("Running stretch_known_error_case_100_100_75. This might abort...");
		let _result = shape_stretch(shape, cx, cy, cz, dx, dy, dz);
		println!("Finished successfully? (If you see this, the bug might be fixed)");
	}

	/// [1, 0, 10] を指定した場合のテストケース
	/// 実行確認用コマンド: cargo test stretch_test_1_0_10 -- --ignored --nocapture
	#[test]
	#[ignore = "for debugging"]
	fn stretch_test_1_0_10() {
		let shape = load_step();

		// cut: [1, 0, 10]
		let (cx, cy, cz) = (1.0, 0.0, 10.0);
		let (dx, dy, dz) = (10.0, 0.0, 0.0);

		println!("Running stretch_test_1_0_10...");
		let _result = shape_stretch(shape, cx, cy, cz, dx, dy, dz);
		println!("Finished successfully!");
	}

	// -------------------------------------------------------------------------
	// BRepBuilderAPI_Copy 導入コスト見積もり用ベンチマーク
	// -------------------------------------------------------------------------

	/// shape_stretch の各ステップにかかる時間を計測する。
	/// BRepBuilderAPI_Copy を導入した場合の追加コストは:
	///   intersect / subtract / union ごとに 1 回 copy が走るため
	///   「copy 1回あたりのコスト × 演算回数」が上乗せになる。
	/// clean() の実行時間が copy の上限目安になる（copy は clean より軽い）。
	///
	/// cargo test bench_stretch_timing -- --ignored --nocapture
	#[test]
	#[ignore = "timing benchmark"]
	fn bench_stretch_timing() {
		use std::time::Instant;

		let iterations = 5;

		// --- shape_stretch 全体 ---
		let mut total_stretch = std::time::Duration::ZERO;
		for _ in 0..iterations {
			let shape = load_step();
			let t = Instant::now();
			let _r = shape_stretch(shape, 1.0, 0.0, 10.0, 10.0, 0.0, 0.0);
			total_stretch += t.elapsed();
		}
		let avg_stretch = total_stretch / iterations;
		println!("shape_stretch 全体:      {:>8.2?} (avg over {})", avg_stretch, iterations);

		// --- 個別ステップ（intersect / subtract / union / clean）---
		// BRepBuilderAPI_Copy は union や clean と同等か軽い操作なので
		// これらの時間が copy 1回あたりのコスト上限目安になる。
		let big = 10_000.0_f64;

		let mut total_intersect = std::time::Duration::ZERO;
		let mut total_subtract = std::time::Duration::ZERO;
		let mut total_union = std::time::Duration::ZERO;
		let mut total_clean = std::time::Duration::ZERO;

		for _ in 0..iterations {
			let shape = load_step();
			let cutter =
				Shape::box_from_corners(dvec3(1.0, -big, -big), dvec3(big, big, big));

			let t = Instant::now();
			let pos = shape.intersect(&cutter).shape;
			total_intersect += t.elapsed();

			let t = Instant::now();
			let neg = shape.subtract(&cutter).shape;
			total_subtract += t.elapsed();

			let filler = Shape::box_from_corners(dvec3(1.0, 0.0, 0.0), dvec3(11.0, 200.0, 100.0));

			let t = Instant::now();
			let merged = neg.union(&filler).shape.union(&pos).shape;
			total_union += t.elapsed();

			let t = Instant::now();
			let _cleaned = merged.clean();
			total_clean += t.elapsed();
		}

		println!(
			"intersect:               {:>8.2?} (avg) ← copy 1回の上限目安",
			total_intersect / iterations
		);
		println!(
			"subtract:                {:>8.2?} (avg) ← copy 1回の上限目安",
			total_subtract / iterations
		);
		println!(
			"union×2:                 {:>8.2?} (avg) ← copy 1回の上限目安",
			total_union / iterations
		);
		println!(
			"clean:                   {:>8.2?} (avg) ← copy 1回の上限目安",
			total_clean / iterations
		);
		println!();
		println!("【判定基準】");
		println!("  BRepBuilderAPI_Copy は intersect/subtract/union より軽い操作。");
		println!("  shape_stretch では copy が最大 5〜6 回走る想定。");
		println!("  上記の値 × 5〜6 が許容 10ms 以内なら導入コストは問題なし。");
	}

	// -------------------------------------------------------------------------
	// STATUS_HEAP_CORRUPTION 最小再現テスト群（外部 STEP ファイル不要）
	// -------------------------------------------------------------------------

	/// 【回帰①】stretch_test_1_0_10 と同じパラメータを Box で試す
	/// deep_copy 導入後はクラッシュせずに完走することを確認する。
	#[test]
	fn heap_corruption_box_same_params() {
		let shape = Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		println!("shape_stretch 開始");
		let _result = shape_stretch(shape, 1.0, 0.0, 10.0, 10.0, 0.0, 0.0);
		println!("Drop 直前");
		// _result がここで drop → STATUS_HEAP_CORRUPTION が発生するか観察
	}

	/// 【再現②】shape_stretch を経由せず Boolean 演算チェーンを直接組む
	/// intersect → subtract → union（フィラー付き）→ clean の最小構成。
	/// shape_stretch 内のどの操作が引き金かを特定するための最小ケース。
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
		let mut pos_half = shape.intersect(&cutter).shape;
		let neg_half = shape.subtract(&cutter).shape;
		pos_half.set_global_translation(dvec3(delta, 0.0, 0.0));

		// フィラー（平行移動で生じたギャップを埋めるボックス）
		let filler =
			Shape::box_from_corners(dvec3(cut_x, 0.0, 0.0), dvec3(cut_x + delta, 80.0, 60.0));

		let merged = neg_half.union(&filler).shape.union(&pos_half).shape;
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

		let mut pos_half = shape.intersect(&cutter).shape;
		let neg_half = shape.subtract(&cutter).shape;

		drop(cutter); // ← 入力の早期解放 → ACCESS_VIOLATION が起きるか観察

		pos_half.set_global_translation(dvec3(delta, 0.0, 0.0));

		let filler =
			Shape::box_from_corners(dvec3(cut_x, 0.0, 0.0), dvec3(cut_x + delta, 80.0, 60.0));
		let _result = neg_half.union(&filler).shape.union(&pos_half).shape;

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
		let shape = box_a.union(&box_b).shape;

		// x=100 の面（L字残余部分）が extrude_cut_faces にマッチする
		println!("shape_stretch 開始");
		let _result = shape_stretch(shape, 100.0, 0.0, 0.0, 20.0, 0.0, 0.0);
		println!("Drop 直前");
	}

	/// 【回帰⑤】シリンダー穴あきボックス（曲面トポロジーを含む複合形状）
	/// deep_copy 導入後は曲面を含む複合形状でもクラッシュしないことを確認する。
	#[test]
	fn heap_corruption_cylinder_hole() {
		use glam::DVec3;
		let box_shape =
			Shape::box_from_corners(dvec3(0.0, 0.0, 0.0), dvec3(100.0, 80.0, 60.0));
		// Z方向に貫通するシリンダーで穴を開ける（曲面＋円形エッジが生まれる）
		let hole = Shape::cylinder(dvec3(50.0, 40.0, -1.0), 15.0, DVec3::Z, 62.0);
		let shape = box_shape.subtract(&hole).shape;

		println!("shape_stretch 開始");
		let _result = shape_stretch(shape, 50.0, 40.0, 30.0, 20.0, 0.0, 0.0);
		println!("Drop 直前");
	}
}
