# S3 Bucket 命名規則・保存期間

## bucket_temp（一時バケット）

STEPファイルのアップロード・変換処理に使う一時バケット。

### 保存期間

| プレフィックス | 保存期間 | 対象 |
|---|---|---|
| `_/` | **1日** | 変換処理中の一時ファイル（stepとlog） |
| その他 | **180日** | デフォルト |

### オブジェクト一覧

| キー | 内容 | 保存期間 |
|---|---|---|
| `_/{uuid}.step` | クライアントがアップロードしたSTEPファイル | 1日 |
| `_/{uuid}.log` | 変換進捗ログ（JSON）。`/api/step/{id}/status` で参照される | 1日 |
| `{shape_hash}` | shape_compute結果のGLBキャッシュ | 180日 |

`{uuid}` は UUIDv7（`/api/step/upload` レスポンスの `id` フィールド）。

---

## bucket_main（永続バケット）

変換済みファイルのキャッシュバケット。content-addressable storage。

### 保存期間

ライフサイクルルールなし（**無期限**）。

### オブジェクト一覧

| キー | 内容 | MIMEタイプ |
|---|---|---|
| `{content_hash}.step` | 変換元のSTEPファイル | `application/step` |
| `{content_hash}` | 変換後のBRepファイル（拡張子なし） | `application/octet-stream` |

`{content_hash}` はSTEPファイルのコンテンツハッシュ（SHA-256系）、`{shape_hash}` はShapeNodeのJSONをRFC 8785 (JCS) で正規化したSHA-256（拡張子なし）。
