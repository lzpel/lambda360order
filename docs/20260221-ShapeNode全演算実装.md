# ShapeNode 全演算実装（2026-02-21）

## 概要

`api/src/shape.rs` の `shape()` 関数に、StepNode 以外の全 ShapeNode バリアントを実装した。
これにより Union / Intersect / Subtract / Translate / Scale / Rotate / Stretch がサーバー側で動作するようになった。

---

## 実装内容

### 構造の変更

`shape()` を `compute_shape()` + `shape()` に分離した。

- `compute_shape(node, breps) -> Result<Shape, String>` — ShapeNode ツリーを再帰的に評価して opencascade::Shape を返す
- `shape(node, breps) -> Result<Vec<u8>, String>` — compute_shape を呼び、メッシュ化して GLB バイト列を返す（以前と同じシグネチャ）

### 各バリアント

| バリアント | 実装方法 |
|---|---|
| **Step** | 従来どおり。BRep を一時ファイル経由で読み込む |
| **Union** | `Shape::union(&other)` → `Shape::from(BooleanShape)` |
| **Intersect** | `Shape::intersect(&other)` → `Shape::from(BooleanShape)` |
| **Subtract** | `Shape::subtract(&other)` → `Shape::from(BooleanShape)` |
| **Translate** | `Shape::set_global_translation(DVec3)` で location を設定 |
| **Scale** | `occ_ffi::gp_Trsf::SetScale` + `brep_apply_trsf()` |
| **Rotate** | `occ_ffi::gp_Trsf::SetRotation` + `brep_apply_trsf()` |
| **Stretch** | 半空間ボックスで分割 → 正側を delta 移動 → Union で再結合 |

### 追加した依存クレート

```toml
opencascade-sys = { git = "https://github.com/lzpel/opencascade-rs", version = "0.2.0" }
glam = "0.24"
```

`opencascade-sys` は `opencascade` の内部クレートで、もともとトランジティブ依存として Cargo.lock に存在していた。

---

## Scale / Rotate の実装詳細：`brep_apply_trsf()`

`opencascade::Shape` の `inner` フィールド（`UniquePtr<TopoDS_Shape>`）は `pub(crate)` のため、
`api` クレートから直接 `BRepBuilderAPI_Transform` に渡すことができない。

回避策として **BRep 一時ファイルを橋渡しに使う** `brep_apply_trsf()` を実装した：

```
Shape → write_brep(tmp_in) → ffi::read_brep → BRepBuilderAPI_Transform(copy=true)
      → ffi::write_brep(tmp_out) → Shape::read_brep → Shape
```

- `copy=true` により頂点座標が物理的に変換される（location は identity のまま）
- これにより後続の `set_global_translation` や boolean 演算と正しく合成できる

**パフォーマンス面の懸念**：BRep のシリアライズ/デシリアライズが Scale/Rotate ごとに発生する（1〜数十 MB のファイル IO）。
複雑なツリーでは累積コストになりうる。キャッシュ（`cached_shape()`）が効いていれば二度目以降は問題ない。

---

## Stretch の実装詳細

### インターフェース

```
cut   = [px, py, pz, nx, ny, nz]  // 切断平面の点 + 法線（正の側が移動）
delta = [dx, dy, dz]               // 正の側のオフセット
```

### アルゴリズム

1. `Shape::box_from_corners((-L, -L, 0), (L, L, L))` で z > 0 の半空間を近似するボックスを作成（L = 1e6 mm）
2. Z 軸を法線 N に合わせる回転を `brep_apply_trsf` で適用
   - 回転軸 = Z × N = (-ny, nx, 0)、回転角 = arccos(nz)（ロドリゲスの公式）
   - N ≈ +Z のとき回転省略、N ≈ −Z のとき X 軸周りに π 回転
3. `set_global_translation(p)` でカットボックスを点 p へ平行移動
4. `shape.intersect(&cutting_box)` → 正側、`shape.subtract(&cutting_box)` → 負側
5. 正側に `set_global_translation(delta)` を設定
6. `above.union(&below)` で再結合

### 懸念：隙間が埋まらない

現状の実装では、正側を delta だけ移動するだけで**切断面間の隙間を埋める処理がない**。

```
元: [===A===|===B===]
実装後: [===A===]   [===B===]   ← 隙間がある
理想: [===A===][===bridge===][===B===]
```

単純な直方体や円柱（切断面が平面かつ delta が法線方向に平行）であれば、
A の端面と B の端面が完全に一致するため union 後に隙間はできない。
ただし曲面・斜め断面・delta が法線に非平行な場合は隙間が残る。

`20260217-伸縮機能.md` に書かれた理想実装（`BRepOffsetAPI_ThruSections` などで橋渡し）は未着手。

---

## NumberOrExpr の式評価

`NumberOrExpr::Variant1(String)` の式（例: `"$width * 0.5 + 50"`）は**未対応**。
渡された場合は即座にエラーを返す。

フロントエンドが `$式` を評価してから API に渡す設計（`params` が解決済みの純粋な数値ツリーを送る）であれば問題ない。
サーバー側での式評価が必要な場合は別途実装が要る。

---

## テストの変更

`shape_unsupported_node_returns_err` → `shape_union_missing_brep_returns_err` に改名。

Union はサポートされたため「BRep データが存在しない場合にエラーになること」を確認するテストに変更した。
Union / Scale / Rotate / Stretch の正常系テストは未追加（実際の BRep ファイルが複数必要）。

---

## 残課題

| 課題 | 優先度 | 備考 |
|---|---|---|
| Stretch の隙間埋め | 中 | 箱状の単純形状では問題なし。複雑形状で問題になったら対応 |
| `brep_apply_trsf` のパフォーマンス | 低 | キャッシュが効く前提。深いツリーで遅い場合は opencascade クレートに PR を出してアクセサを追加するのが本筋 |
| NumberOrExpr の式評価 | 低 | フロントエンドで解決済みの数値を渡す設計なら不要 |
| Scale / Rotate / Stretch の正常系テスト | 低 | 統合テスト環境が整ってから追加 |
| 非一様スケーリング（x/y/z 個別）| 未定 | 現状は `gp_Trsf::SetScale`（一様）のみ。`演算定義.md` の議論通り、非一様は Stretch で対応する想定 |
