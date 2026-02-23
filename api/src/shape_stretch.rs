use glam::{DVec3, dvec3};
use opencascade::primitives::{Edge, EdgeConnection, Face, Shape, Wire};
use opencascade::section;

/// 大箱の半辺長（半空間代用）
const BIG: f64 = 1_000_000.0;
/// 断面取得用スラブの半厚み (mm)
const SLAB: f64 = 0.01;

/// 断面エッジ群からコネクタ Shape を生成する（Wire → Face → Prism 押し出し）。
/// 断面が空またはワイヤー構築に失敗した場合は Err を返す。
fn build_connector(edge_shapes: &[Shape], dir: DVec3) -> Result<Shape, String> {
	let edges: Vec<Edge> = edge_shapes.iter().flat_map(|s| s.edges()).collect();
	if edges.is_empty() {
		return Err("Section produced no edges".to_string());
	}
	let wire = Wire::from_unordered_edges(edges.iter(), EdgeConnection::default());
	let face = Face::from_wire(&wire);
	let solid = face.extrude(dir);
	Ok(Shape::from(solid))
}

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
		let slab =
			Shape::box_from_corners(dvec3(cx - SLAB, -BIG, -BIG), dvec3(cx + SLAB, BIG, BIG));
		let edge_shapes = section::edges(&shape, &slab);

		let half_pos = Shape::box_from_corners(dvec3(cx, -BIG, -BIG), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(dx, 0.0, 0.0));

		shape = match build_connector(&edge_shapes, dvec3(dx, 0.0, 0.0)) {
			Ok(connector) => part_neg.union(&connector).shape.union(&part_pos).shape,
			Err(_) => part_neg.union(&part_pos).shape,
		};
	}

	// Y軸方向: y > cy の部分を dy だけ +Y 方向に移動
	if dy > 1e-10 {
		let slab =
			Shape::box_from_corners(dvec3(-BIG, cy - SLAB, -BIG), dvec3(BIG, cy + SLAB, BIG));
		let edge_shapes = section::edges(&shape, &slab);

		let half_pos = Shape::box_from_corners(dvec3(-BIG, cy, -BIG), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(0.0, dy, 0.0));

		shape = match build_connector(&edge_shapes, dvec3(0.0, dy, 0.0)) {
			Ok(connector) => part_neg.union(&connector).shape.union(&part_pos).shape,
			Err(_) => part_neg.union(&part_pos).shape,
		};
	}

	// Z軸方向: z > cz の部分を dz だけ +Z 方向に移動
	if dz > 1e-10 {
		let slab =
			Shape::box_from_corners(dvec3(-BIG, -BIG, cz - SLAB), dvec3(BIG, BIG, cz + SLAB));
		let edge_shapes = section::edges(&shape, &slab);

		let half_pos = Shape::box_from_corners(dvec3(-BIG, -BIG, cz), dvec3(BIG, BIG, BIG));
		let mut part_pos = shape.intersect(&half_pos).shape;
		let part_neg = shape.subtract(&half_pos).shape;
		part_pos.set_global_translation(dvec3(0.0, 0.0, dz));

		shape = match build_connector(&edge_shapes, dvec3(0.0, 0.0, dz)) {
			Ok(connector) => part_neg.union(&connector).shape.union(&part_pos).shape,
			Err(_) => part_neg.union(&part_pos).shape,
		};
	}

	Ok(shape)
}
