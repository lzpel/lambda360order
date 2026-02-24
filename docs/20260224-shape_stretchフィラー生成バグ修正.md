# shape_stretch フィラー生成バグ修正

## 概要

`shape_stretch` 関数の「フィラー（ギャップ充填）」生成にバグがあり、切断面の押し出しではなく元形状のスライスコピーになっていた問題を修正した。

## バグの原因

```rust
// 旧: 元shapeから [cx, cx+dx] の範囲をそのまま切り出していた
let gap_box = Shape::box_from_corners(dvec3(cx, -BIG, -BIG), dvec3(cx + dx, BIG, BIG));
let filler = shape.intersect(&gap_box).shape;
```

三角形やフィレットなど形状が変化する領域では、切り出したスライスの断面形状がそのまま残ってしまい、均一な押し出しにならない。

## 修正内容

### アプローチ

`part_neg`（切断位置より負側の半分）の切断面 Face を検出し、`Face.extrude()` で delta だけ押し出してフィラーソリッドを生成する方式に変更。

### 変更ファイル

**api/src/shape_stretch.rs**

- `extrude_cut_faces()` ヘルパー関数を新設
  - `half.faces()` をイテレートし、法線（`normal_at_center()`）と座標（`center_of_mass()`）で切断面を判定
  - 判定条件: 法線の軸成分の絶対値 > 0.99 かつ 座標の軸成分 ≈ cut_coord（許容誤差 0.1mm）
  - マッチした Face を `face.extrude(dir)` で押し出し、複数あれば union で結合
- `stretch_axis()` ヘルパー関数を新設
  - 1軸分の切断+移動+ギャップ充填ロジックを集約（旧コードは3軸べた書きだった）
- `shape_stretch()` 本体を簡素化
  - `stretch_axis` を X → Y → Z の順に呼ぶだけ

### 使用した opencascade-rs API

| API | 用途 |
|---|---|
| `Shape.faces()` → `FaceIterator` | 切断後のソリッドからFace列挙 |
| `Face.normal_at_center()` → `DVec3` | 面の法線で切断面かどうか判定 |
| `Face.center_of_mass()` → `DVec3` | 面の位置で切断座標との一致を判定 |
| `Face.extrude(dir)` → `Solid` | 切断面を指定方向に押し出してフィラー生成（BRepPrimAPI_MakePrism） |

新たな OCCT API のラッピングは不要だった。

## テスト結果

```
cargo test shape_stretch -- --nocapture

stretch_box_x_axis ... ok
stretch_zero_delta_is_noop ... ok
stretch_negative_delta_clamped ... ok
```

`generate_stretched_glb` でSTEPファイル → ストレッチ → GLB出力がエラーなく完了:

```
STEP読み込み完了, bbox center = DVec3(0.0, 0.0, 0.0)
ストレッチ完了
メッシュ生成完了: vertices=268, indices=600
生成完了: ../out/LAMBDA360-BOX-stretched.glb (15452 bytes)
```

> [!NOTE]
> GLBの中身（ジオメトリの正しさ）は目視確認していない。フロントエンドでの目視確認が必要。
