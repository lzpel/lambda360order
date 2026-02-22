# Lambda360 Order

3Dモデルの閲覧・注釈・発注を統合した、次世代の3Dコマース・プロトタイピングプラットフォームです。
`lambda360view` をベースに、Web上での3Dデータの可視化とインタラクティブな操作を提供します。

## apiのurl

- **Main API**: https://dfrujiq0byx89.cloudfront.net/api/ui
- **Sandbox Stream API (Experimental)**: https://dfrujiq0byx89.cloudfront.net/sandbox-stream-api/ui (実験場)

## 主要なフォルダの詳細

本レポジトリはバックエンド、フロントエンド、インフラを含むモノレポ構成です。

### `/api` (Backend)
- **技術スタック**: Rust (Axum, Lambda Web Adapter)
- **役割**: 本来はフロントエンドのJavaScriptで完結させたい処理のうち、計算負荷が高くブラウザでは処理速度が不足するタスク（3Dデータの重い演算など）をオフロードするための実行環境です。

### `/frontend` (Web Application & Order Widget)
- **技術スタック**: Vite, React, TypeScript
- **役割**: メインのWebアプリケーションおよび外部埋め込み用ウィジェット。
  - `make run` または GitHub Pages: デモアプリケーションとして動作
  - `widget.js`: 外部サイト埋め込み用スクリプトとしてビルド
- **主なページ**:
  - `/brep`: BREPビューワー
  - `/order0`: 発注プロセスモックアップ
  - `/insert`: 埋め込みデモ

### `/aws` (Infrastructure)
- **技術スタック**: AWS CDK (TypeScript)
- **役割**: APIのデプロイやS3/CloudFront等のインフラ構成管理。

### `/docs`
- **役割**: 技術的意思決定、市場分析、UX設計等のドキュメント。
  - `20260212-ビジネス価値と批判.md`: プロジェクトのコアバリュー
  - `宣言的CAD.md`: 幾何学的な設計思想

### `/sandbox-opencascade-rs` (3D Engine Sandbox)
- **技術スタック**: Rust, OpenCascade
- **役割**: 3D幾何計算エンジンの検証用環境。WASM化や高速化のプロトタイプ開発。

### `/sandbox-stream-api`
- **役割**: ストリーミングAPI（SSE）の実験場。

### `/public`
- **役割**: 共通の静的アセット（3Dモデルデータやビルド済みウィジェット）の格納。

### `index.html`
- **役割**: `embedded` ウィジェットの動作確認用デモページ。

## 開発ガイド

### クイックスタート

ルートディレクトリにある `makefile` を使用して、各コンポーネントを一括で操作できます。

```bash
# 全プロジェクトの前処理（インストールやコード生成）を実行
make generate

# 開発用サーバーの起動
make run
```

### デプロイ

インフラおよびアプリケーションのデプロイは以下のコマンドで実行します。

```bash
make deploy
```

## ライセンス
[License Title] - 詳細は各ディレクトリのLICENSEファイルを参照してください。
