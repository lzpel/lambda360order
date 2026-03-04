# chijin color機能統合計画

作成日: 2026-03-04

## 概要

chijin を `0.2.1` → `0.3.1` にアップデートし、`--features color` を有効化することで、
色情報を保持した STEP 入力・BRep キャッシュ保存・GLB 出力のパイプラインを構築する。

---

## 背景・目的

chijin 0.3.1 の `color` feature は以下を提供する：

| 機能 | API | 説明 |
|---|---|---|
| 色付き STEP 読込 | `Shape::read_step_with_colors()` | XDE (OCCT Extended Data Framework) でRGB色情報を抽出 |
| 色付き STEP 書出 | `Shape::write_step_with_colors()` | XDE で色情報をSTEPに書き戻す |
| 色付き BRep 読込 | `Shape::read_brep_color()` | CHJC形式（BRep + 色メタデータ）を読み込む |
| 色付き BRep 書出 | `Shape::write_brep_color()` | CHJC形式で書き出す |
| フェイス色参照 | `shape.colormap: HashMap<TShapeId, Rgb>` | TShapeId → RGB (0.0..=1.0) |
| フェイスID取得 | `face.tshape_id()` (`color` feature限定) | colormap の検索キー |

### CHJC フォーマット（色付き BRep）

```
[magic "CHJC"][version: u8][色エントリ数: u32][フェイスindex: u32, r/g/b: f32 × N][BRepバイナリ長: u32][BRepバイナリ]
```

BRep を読み直した際にフェイスポインタアドレスが変わる問題を、
**フェイスのイテレーション順序（インデックス）** で色を記録することで解決している。

---

## 変更対象ファイル

### 1. `api/Cargo.toml`

```toml
# 変更前
chijin = { version = "^0.2.1", features = ["prebuilt"], default-features = false }

# 変更後
chijin = { version = "^0.3.1", features = ["prebuilt", "color"], default-features = false }
```

### 2. `api/src/step_to_brep.rs` — 色付き STEP → BRep パイプライン

**変更箇所: `Shape::read_step` → `Shape::read_step_with_colors`**

```rust
// 変更前
let task_read_step = tokio::task::spawn_blocking(move || {
    Shape::read_step(&mut std::io::Cursor::new(step_data_clone))
});

// 変更後
let task_read_step = tokio::task::spawn_blocking(move || {
    Shape::read_step_with_colors(&mut std::io::Cursor::new(step_data_clone))
});
```

**変更箇所: `write_brep_bin` → `write_brep_color`（CHJC形式）**

```rust
// 変更前
let mut brep_data: Vec<u8> = Vec::new();
shape.write_brep_bin(&mut brep_data).map_err(|e| ...)?;

// 変更後
let mut brep_data: Vec<u8> = Vec::new();
shape.write_brep_color(&mut brep_data).map_err(|e| ...)?;
```

BRep ファイルの保存キー（`{content_hash}` 拡張子なし）は変更しない。
CHJC 形式でも BRep 形式でも同じキーで保存する（後方互換のため）。

> **注意**: 既存キャッシュ（旧BRep形式）の読み込みはフォールバック処理で吸収する（後述）。

### 3. `api/src/shape.rs` — 色付き BRep の読込

**変更箇所: `collect_shape` の BRep 読込部分**

```rust
// 変更前
let shape = Shape::read_brep_text(&mut std::io::Cursor::new(&data))
    .or_else(|_| Shape::read_brep_bin(&mut std::io::Cursor::new(&data)))
    .map_err(|e| format!("Failed to read brep '{}': {:?}", sha256, e))?;

// 変更後（CHJC → テキスト → バイナリの順でフォールバック）
let shape = Shape::read_brep_color(&mut std::io::Cursor::new(&data))
    .or_else(|_| Shape::read_brep_bin(&mut std::io::Cursor::new(&data)))
    .or_else(|_| Shape::read_brep_text(&mut std::io::Cursor::new(&data)))
    .map_err(|e| format!("Failed to read brep '{}': {:?}", sha256, e))?;
```

フォールバック順序:
1. `read_brep_color` (CHJC形式 — 新規キャッシュ・色情報あり)
2. `read_brep_bin` (旧バイナリ形式 — 色情報なし)
3. `read_brep_text` (旧テキスト形式 — 色情報なし)

色情報なしの場合、`shape.colormap` は空になる（GLB はグレー単色フォールバック）。

### 4. `api/src/shape_to_glb.rs` — 色付き GLB 出力（主要変更）

#### 設計方針：色ごとに glTF プリミティブを分割

1. `shape.faces()` でフェイスをイテレーション
2. 各フェイスの `face.tshape_id()` → `shape.colormap.get(&id)` で色を取得
3. 同じ色のフェイスをグループ化
4. 各色グループをフェイスリストから Shape（Compound）として構築しメッシュ化
5. 各グループに対応する glTF プリミティブ＋マテリアルを生成

#### 色グループ構築 (疑似コード)

```rust
use std::collections::HashMap;
use chijin::{Rgb, TShapeId};

// フェイスを色ごとにグループ化
let mut color_groups: Vec<(Option<Rgb>, Vec<Face>)> = Vec::new();
// ... shape.faces() をイテレーションして color に応じて振り分け

// 色なしフェイス（colormap に存在しない）は None グループへ
```

#### フォールバック戦略

- `shape.colormap` が空（旧BRep・色なしSTEP）の場合:
  - 従来通り単一グレープリミティブを出力（既存コードをそのまま使用）
- `colormap` に色がある場合:
  - 色ごとのプリミティブを生成（`KHR_materials_unlit` + `baseColorFactor`）

#### glTF マテリアル出力例

```json
{
  "materials": [
    {
      "extensions": { "KHR_materials_unlit": {} },
      "pbrMetallicRoughness": {
        "baseColorFactor": [0.8, 0.2, 0.2, 1.0],
        "metallicFactor": 0.0,
        "roughnessFactor": 1.0
      }
    },
    {
      "extensions": { "KHR_materials_unlit": {} },
      "pbrMetallicRoughness": {
        "baseColorFactor": [0.2, 0.8, 0.8, 1.0],
        "metallicFactor": 0.0,
        "roughnessFactor": 1.0
      }
    }
  ]
}
```

#### `create_glb` シグネチャ変更

```rust
// 変更前
pub fn create_glb(mesh: &chijin::Mesh, shape: &Shape) -> Result<Vec<u8>, String>

// 変更後 — mesh_with_tolerance を内部で呼び出す
pub fn create_glb(shape: &Shape) -> Result<Vec<u8>, String>
```

`mesh_with_tolerance(0.1)` の呼び出しを `create_glb` 内部に移動する。
これにより呼び出し側 (`shape.rs`) では `create_glb(&occ_shape)` の一行で済む。

色グループ別メッシュも同関数内で完結する（外部から `Mesh` を渡す必要がなくなる）。

```rust
// shape.rs 呼び出し側（変更後）
pub(crate) fn shape(node: &ShapeNode, shapes: HashMap<String, Shape>) -> Result<Vec<u8>, String> {
    let mut shapes = shapes;
    let occ_shape = eval_shape(node, &mut shapes)?;
    create_glb(&occ_shape)  // ← mesh_with_tolerance は create_glb 内部で呼ぶ
}
```

---

## 実装上の検証事項

実装前に以下を確認する：

| 項目 | 確認方法 |
|---|---|
| `Shape::read_step_with_colors` の存在 | `cargo doc -p chijin --features color --open` |
| `Shape::write_brep_color` / `read_brep_color` の存在 | 同上 |
| `Face::tshape_id()` の存在（color feature限定） | 同上 |
| フェイスから単体 Shape を構築する手段 | chijin tests/integration_color.rs 参照 |
| `Dockerfile` の OCCT ビルドに color feature が必要な追加ライブラリ | `TKLCAF, TKXCAF, TKCDF, TKCAF` (XDE用) — prebuilt ならビルド済みの可能性あり |

---

## 実装ステップ（順序）

```
Step 1  Cargo.toml 更新 → cargo build でコンパイル確認
Step 2  step_to_brep.rs: read_step_with_colors + write_brep_color
Step 3  shape.rs: read_brep_color + フォールバック
Step 4  shape_to_glb.rs: 色グループ別プリミティブ生成
Step 5  ローカルテスト（色付き STEP ファイルで手動確認）
Step 6  Dockerfile / DockerfileAsBuilder の更新確認
```

---

## リスクと対策

| リスク | 対策 |
|---|---|
| prebuilt バイナリに XDE ライブラリが含まれないコンパイルエラー | chijin リポジトリの DockerfileAsBuilder を参照してビルド手順を確認 |
| フェイスから Shape を構築する API が未提供 | 全体メッシュ化後に COLOR_0 頂点属性で近似カラー割り当てに切り替え |
| 既存キャッシュ（旧 BRep 形式）との互換性 | フォールバック読込順序で吸収済み |
| chijin 0.3.1 の API 変更で既存コードがビルド不可 | Step 1 のコンパイル確認で早期検出 |
