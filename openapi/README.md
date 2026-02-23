# openapi

Lambda360 API のスキーマ定義と TypeScript クライアント生成を担当するディレクトリです。

## 構成

```
main.tsp          # TypeSpec によるAPI定義（単一ソース）
makefile          # generate ターゲットのみ
package.json      # TypeSpec / @hey-api/openapi-ts
out.yaml          # tsp compile に渡す設定（generate 時に生成）
out.ts            # openapi-ts に渡す設定（generate 時に生成）
```

## ツール

| ツール | 役割 |
|---|---|
| [TypeSpec](https://typespec.io/) | `main.tsp` → `../out/openapi.json` を生成 |
| [@hey-api/openapi-ts](https://heyapi.dev/) | `../out/openapi.json` → `../out/client/` に TypeScript クライアントを生成 |

## 実行

```sh
make generate
```

`out.yaml` と `out.ts` はビルド時に makefile の heredoc から生成されるため、直接編集しても次回 `make generate` で上書きされます。定義を変更する場合は `makefile` 内の `tspconfig` / `openapi_ts` を編集してください。

## API 概要

ベースURL: `/api`

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/version` | バージョン・バケット名の確認 |
| POST | `/step/upload` | Presigned URL と ID を取得 |
| POST | `/step/{id}/execute` | STEP → BRep 変換の実行 |
| GET | `/step/{id}/status` | 変換進捗の確認 |
| POST | `/shape` | ShapeNode を GLB に変換 |
