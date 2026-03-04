# chijin issue: Mesh に face_id を追加してほしい（color feature）

作成日: 2026-03-04
対象リポジトリ: https://github.com/lzpel/chijin

---

## 問題

`color` feature で `shape.colormap: HashMap<TShapeId, Rgb>` が得られ、
`face.tshape_id()` でフェイスと色の対応もわかる。

しかし `mesh_with_tolerance()` が返す `Mesh` に **三角形ごとの face_id がない**ため、
「三角形 → 色」の対応が取れず、色付き GLB を出力できない。

---

## 原因

`mesh_with_tolerance` の内部実装は OCC の per-face 三角形分割（`BRep_Tool::Triangulation`）を
フェイスごとに積み上げているはずなので、**構築中には `TShapeId → 三角形範囲` の対応が既に存在する**。
現状はその情報を捨てて `vertices`/`indices` だけを返している。

---

## 要望

`color` feature 有効時に `Mesh` へ `face_ids` フィールドを追加する。

```rust
pub struct Mesh {
    pub vertices: Vec<DVec3>,
    pub uvs:      Vec<DVec2>,
    pub normals:  Vec<DVec3>,
    pub indices:  Vec<usize>,
    #[cfg(feature = "color")]
    pub face_ids: Vec<TShapeId>,  // 三角形ごと、indices.len() / 3 個
}
```

`face_ids[i]` は `indices[i*3]`〜`indices[i*3+2]` が属するフェイスの `TShapeId`。

---

## 利用側での使い方

GLB は `KHR_materials_unlit` + `baseColorFactor` によるプリミティブ単位の色指定を使う。
頂点バッファを1つ共有したまま、インデックスバッファだけ色ごとに分割する。

```rust
let mesh = shape.mesh_with_tolerance(0.1)?;

// 三角形を色ごとにグループ化
let mut color_indices: HashMap<RgbKey, Vec<usize>> = HashMap::new();
for (tri_idx, &face_id) in mesh.face_ids.iter().enumerate() {
    let color = shape.colormap.get(&face_id).copied().unwrap_or(GRAY);
    color_indices.entry(rgb_key(color))
        .or_default()
        .extend_from_slice(&mesh.indices[tri_idx*3..tri_idx*3+3]);
}

// 色ごとにプリミティブを生成（頂点バッファは共有）
for (color, indices) in color_indices {
    // → indices を index buffer、color を baseColorFactor に設定
}
```

これにより lambda360form 側は追加の API なしで色付き GLB を実装できる。

---

## 実装コスト

- C++ 側: `mesh_shape()` FFI 関数で各フェイスの三角形を積む際に `face_tshape_id()` を記録して返すだけ
- Rust 側: `Mesh` 構造体に `#[cfg(feature = "color")] pub face_ids: Vec<TShapeId>` を追加するだけ
- 既存 API への影響: `color` feature 未使用時は構造体変化なし
