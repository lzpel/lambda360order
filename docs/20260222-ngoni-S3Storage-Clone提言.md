# ngoni: S3Storage 改善提言

## 背景

`lambda360order` の API サーバー（Rust/axum）で `ngoni::s3::S3Storage` を使用する中で
いくつかの問題点・改善点を発見した。優先度順に記載する。

---

## 1. テストのコンパイルエラー（バグ）

**深刻度: 高**

`test_all_operations` の read 検証が型不一致でコンパイルできない。

```rust
// 現状 (s3.rs:335-336)
let read_data = s3.read(test_key).await?;   // (ObjectMeta, Vec<u8>)
assert_eq!(&read_data, &content);           // &Vec<u8> と比較 → 型不一致
```

`read()` は `(ObjectMeta, Vec<u8>)` を返すため、`Vec<u8>` と直接比較できない。

```rust
// 修正案
let (_meta, read_data) = s3.read(test_key).await?;
assert_eq!(read_data, content);
```

---

## 2. エラー型が統一されていない

**深刻度: 中**

`S3Error` 列挙型が定義されているにもかかわらず、メソッドごとに返すエラー型がバラバラ。

| メソッド | 現在の戻り値エラー型 |
|---------|-------------------|
| `read` | `SdkError<GetObjectError>` |
| `write` | `SdkError<PutObjectError>` |
| `head` | `SdkError<HeadObjectError>` |
| `remove` | `SdkError<DeleteObjectError>` |
| `copy` | `SdkError<CopyObjectError>` |
| `list` | `SdkError<ListObjectsV2Error>` |
| `relocate` | `S3Error` ✓ |
| `presign_read_url` | `S3Error` ✓ |
| `presign_write_url` | `S3Error` ✓ |

呼び出し側では操作ごとに異なるエラー型を処理する必要があり、`map_err` だらけになる。
すべてのメソッドを `Result<T, S3Error>` に統一すべき。

```rust
// 修正案（例: read）
pub async fn read(&self, key: &str) -> Result<(ObjectMeta, Vec<u8>), S3Error> {
    let resp = self.client.get_object()...send().await
        .map_err(S3Error::GetObject)?;
    let data = resp.body.collect().await
        .map_err(|e| S3Error::Other(e.to_string()))?   // ← 後述の問題も解消
        .to_vec();
    Ok((meta, data))
}
```

---

## 3. `read()` のボディ収集エラーの誤魔化し

**深刻度: 中**

```rust
// 現状 (s3.rs:122)
.map_err(|e| SdkError::construction_failure(e))?
```

`SdkError::construction_failure` はリクエスト構築の失敗を表すものであり、
レスポンスボディの読み取り失敗に使うのは意味的に誤り。
エラー型を `S3Error` に統一すれば `S3Error::Other(e.to_string())` などで適切に扱える。

---

## 4. `Clone` が derive されていない

**深刻度: 中**

```rust
// 現状 (s3.rs:62)
#[derive(Debug)]          // Clone がない
pub struct S3Storage {
    pub bucket: String,   // Clone 可
    pub client: Client,   // Clone 可（aws_sdk_s3::Client は #[derive(Clone)]）
}
```

`tokio::spawn` に渡すなど、所有権を複数箇所に渡す場面で clone できず、
利用側が内部フィールドに直接アクセスする脆い回避コードを書く必要がある。

```rust
// 現状の回避策（lambda360order/api/src/server.rs）
fn clone_s3(s: &ngoni::s3::S3Storage) -> ngoni::s3::S3Storage {
    ngoni::s3::S3Storage {
        bucket: s.bucket.clone(),
        client: s.client.clone(),
    }
}
```

`aws_sdk_s3::Client` は内部で `Arc` を使った参照カウント実装なので clone は安価。

```rust
// 修正案
#[derive(Debug, Clone)]
pub struct S3Storage { ... }
```

---

## 5. `write()` の引数が冗長

**深刻度: 低**

```rust
// 現状
pub async fn write(
    &self,
    key: &str,
    bytes: Vec<u8>,
    content_type: Option<String>,
    metadata: Option<HashMap<String, String>>,
    cache_control: Option<String>,
) -> Result<(), SdkError<PutObjectError>>
```

単純なバイト書き込みでも `None, None, None` を渡す必要があり冗長。
ビルダーパターンか、シンプルな `write_bytes(key, bytes)` を追加すると良い。

```rust
// 利用側の現状
bucket_main.write(&key, data, Some("application/octet-stream".to_string()), None, None).await
```
