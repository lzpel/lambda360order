# sandbox-opencascade-rs

このリポジトリは、OpenCascadeのキャッシュ（B-Rep形式）が形状処理の高速化にどれくらい寄与するかを検証・調査するためのものです。
特に、巨大なSTEPファイルの読み込み時間を短縮するために、一度パースした形状データをB-Rep形式でシリアライズ/デシリアライズする効果を測定します。

## 使用方法

### 必要要件
- Rust toolchain
- OpenCascade Technology (OCCT) library
- Make

### ビルドと実行

基本的なコマンドラインツールとして実行できます。入力ファイルの拡張子（.step, .stp, .brep）と出力ファイルの拡張子（.stl, .json, .brep）を自動判別して変換を行います。

```bash
# ビルド
cargo build --release

# 実行例: STEPファイルを読み込んでSTLを出力
cargo run --release -- input.step output.stl

# 実行例: STEPファイルを読み込んでバイナリBREP（キャッシュ）を出力
# 拡張子が小文字(.brep)の場合はバイナリ形式、大文字(.BREP)の場合はテキスト形式で出力されます
cargo run --release -- input.step cache.brep
```

### 検証コマンド (Makefile)

以下のコマンドで検証プロセスを自動実行できます。

1. **アセット生成** (`make generate`)
   - `public/PA-001-DF7.STEP` を読み込み、`public/PA-001-DF7.brep` (バイナリキャッシュ) を生成します。
   - 生成されたキャッシュから `public/out.json` を生成します。

   ```bash
   make generate
   ```

2. **速度比較テスト** (`make speedtest`)
   - 「STEP読み込み → STL出力」と「BREPキャッシュ読み込み → STL出力」の実行時間を計測・比較します。

   ```bash
   make speedtest
   ```

## 検証結果 (CACHE.md より抜粋)

### 問題
`Shape::read_step()` によるSTEPファイルのパースは非常に高コストで、ファイルサイズによっては読み込みに数秒〜数分を要します。

### 解決策: BREPキャッシュ
OpenCascadeが持つB-Rep形状のシリアライズ機能 (`BRepTools`, `BinTools`) を利用して、パース済みの形状データをバイナリまたはテキスト形式で保存・再利用します。

### パフォーマンス比較

| 方式 | 速度 | 形状情報 | 実装状況 |
|------|------|----------|----------|
| STEP (パース) | 遅い (基準) | 完全 | `Shape::read_step` 標準サポート |
| BREP テキスト | **10-100倍 速い** | 完全 | パッチ適用により実装済 |
| BREP バイナリ | **20-200倍 速い** | 完全 | パッチ適用により実装済 |
| STL キャッシュ | 速い | メッシュのみ (情報欠損) | 標準サポート |

### 実装の詳細
標準の `opencascade-rs` (v0.2) クレートには B-Rep の読み書きを行うバインディングが含まれていませんでした。
本プロジェクトでは、`opencascade-rs` にローカルパッチを適用し、C++の `BRepTools` および `BinTools` へのバインディングを追加することで、このキャッシュ機能を実現しています。
