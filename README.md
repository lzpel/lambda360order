# lambda360order

金属部品のカスタムオーダーを受け付けるB2B SaaSプロジェクト。
顧客がSTEPファイルをアップロードして3Dモデルを確認しながら材質・個数などを指定して発注できる。

## プロジェクト構成

```
lambda360order/
├── openapi/      TypeSpec API定義 → OpenAPI仕様 → TSクライアント生成
├── api/          Rustサーバー (Axum)。ShapeNodeをGLBに変換してS3キャッシュ
├── widget/       React製埋め込みウィジェット (iife bundle)
├── frontend/     Next.js製フロントエンド (内部ツール: アップロード・形状確認など)
├── out/          生成物置き場 (openapi.json, out/client/ のTSクライアント)
├── public/       静的ファイル (widget.jsなど)
└── aws/          AWS CDK インフラ定義
```

## サブプロジェクトの役割

| ディレクトリ | 役割 |
|---|---|
| `openapi/` | TypeSpec (`main.tsp`) でAPI仕様を定義。`make generate` で `out/openapi.json` と `out/client/` (TSクライアント) を生成 |
| `api/` | Rust/Axumサーバー。`make generate` で `out/openapi.json` から `src/openapi.rs` をmandolinで生成 |
| `widget/` | Viteでビルドする埋め込みウィジェット。`make generate` で `out/client/` を `../out/client` からコピー |
| `frontend/` | Next.jsフロントエンド。`make generate` で `out/client/` をコピーし `public/` を同期 |
| `out/` | 各generateステップの生成物。gitで管理。直接編集しない |

## 開発フロー

### 初回セットアップ / API定義変更後

```sh
make generate   # openapi → TS client → openapi.rs を一括再生成
```

内部では以下の順番で実行される:
1. `make -C openapi generate` — TypeSpec → `out/openapi.json` + `out/client/`
2. `make -C widget generate` — `out/client/` を `widget/out/client/` にコピー
3. `make -C frontend generate` — `out/client/` を `frontend/out/client/` にコピー、public同期
4. `make -C api generate` — `out/openapi.json` → `api/src/openapi.rs` (mandolin)

### 開発サーバー起動

```sh
make run
```

`rebab` でリバースプロキシを立て、同一ホスト・同一ポートで以下を共存させる:
- `/api/*` → `api/` のRustサーバー (port 7996)
- その他 → `frontend/` のNext.js (port 7997)

### デプロイ

```sh
make deploy-aws   # generate + deploy + AWS CDK deploy
```

デプロイ先: https://dfrujiq0byx89.cloudfront.net

## 主要な型: ShapeNode

形状の演算ツリーを表すdiscriminated union。`openapi/main.tsp` で定義。

```typescript
type ShapeNode =
  | StepNode        // STEPファイルを読み込む葉ノード
  | UnionShapeNode  // BRepAlgoAPI_Fuse
  | IntersectNode   // BRepAlgoAPI_Common
  | SubtractNode    // BRepAlgoAPI_Cut
  | ScaleNode       // 一様拡大縮小
  | TranslateNode   // 平行移動
  | RotateNode      // 回転
  | StretchNode     // 切断面伸縮
```

`StepNode.content_hash` はSTEPファイルのsha256 hex (64文字)。
フロントエンドで `frontend/app/upload/page.tsx` からSTEPをアップロードすると、
S3に `{sha256}.brep` として変換済みBREPが保存される。

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `POST /api/shape` | ShapeNodeを受け取りGLB (binary) を返す。S3にGLBキャッシュ |
| `POST /api/step/upload` | STEPファイルのアップロード用Presigned URLを取得 |
| `POST /api/step/{id}/execute` | STEP → BREP 変換を実行 |
| `GET /api/step/{id}/status` | 変換進捗を取得 |

## S3キー設計 (現状)

同一バケット (`bucket_main`) 内に以下のキーで保存:
- `{sha256}.brep` — 変換済みBREPファイル
- `{sha256}.glb` — キャッシュ済みGLBファイル (ShapeNodeのJSON canonicalize sha256がキー)

GLBのキャッシュキーは `ShapeNode` の `description` フィールドを除いたJSONをRFC 8785でcanonicalizeしたsha256。

## フロントエンドページ

| パス | 説明 |
|---|---|
| `/upload` | STEPファイルをアップロードしてBREPに変換 |
| `/shape` | Lambda360Shapeのテストページ (StepNode1個を表示) |
