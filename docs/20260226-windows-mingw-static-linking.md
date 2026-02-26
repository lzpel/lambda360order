# Windows で `STATUS_ENTRYPOINT_NOT_FOUND` が発生する原因と対処

## 症状

```
error: process didn't exit successfully: `target\debug\api.exe`
(exit code: 0xc0000139, STATUS_ENTRYPOINT_NOT_FOUND)
```

`cargo run` が成功するが、生成された `api.exe` の起動に失敗する。

---

## 根本原因

### MinGW ランタイム DLL のバージョン競合

`api` クレートは `opencascade-rs` を依存に持つ。これは OpenCASCADE という C++ 重量級ライブラリの Rust バインディングであり、コンパイル時に MinGW GCC ランタイムを多用する。

ビルド環境では GCC 15.2.0 (`/c/Users/smith/mingw64/bin/`) が使われており、生成されたバイナリは以下の DLL に動的リンクされる:

| DLL | 役割 |
|---|---|
| `libstdc++-6.dll` | GCC C++ 標準ライブラリ |
| `libgcc_s_seh-1.dll` | GCC ランタイム (SEH 例外処理) |
| `libwinpthread-1.dll` | POSIX スレッド |

これらは Windows 標準には含まれないため、起動時に Windows が PATH から探索する。

### PATH 汚染

問題の環境での `PATH` 順序:

```
/mingw64/bin          ← 先頭 (GitHub Desktop 等のアプリが同梱する古い DLL)
...
/c/Users/smith/mingw64/bin  ← 後方 (GCC 15.2.0 の正しい DLL)
```

Windows は `libstdc++-6.dll` を `/mingw64/bin/` で先にヒットさせる。
このバージョンには GCC 15.2.0 がコンパイル時に参照した新しいエントリポイントが存在しないため、プロセス起動時にクラッシュする。

### Linux/WSL で問題が出ない理由

WSL は glibc 環境であり MinGW ランタイム DLL を使わない。
また、Linux の `libc.so` / `libstdc++.so` はディストリビューションが一元管理するため、バージョン混在が起きにくい。

### Linux の類似問題との対比

構造は **glibc バージョン問題**と同一:

| | Linux (glibc) | Windows (MinGW) |
|---|---|---|
| 症状 | `symbol 'xxx@GLIBC_2.35' not found` | `STATUS_ENTRYPOINT_NOT_FOUND` |
| 原因 | ビルド時より古い glibc が実行環境にある | ビルド時より古い libstdc++ が PATH に先にある |
| 解決 | 古い glibc でビルドし直す or 静的リンク | 静的リンク or DLL を同梱 |

---

## 解決策

### 採用: MinGW ランタイムを静的リンク

`api/.cargo/config.toml` に以下を設定:

```toml
[target.x86_64-pc-windows-gnu]
rustflags = [
  "-C", "link-args=-static-libgcc -static-libstdc++ -Wl,-Bstatic,-lpthread,-Bdynamic",
]
```

| フラグ | 効果 |
|---|---|
| `-static-libgcc` | `libgcc_s_seh-1.dll` をバイナリに埋め込む |
| `-static-libstdc++` | `libstdc++-6.dll` をバイナリに埋め込む |
| `-Wl,-Bstatic,-lpthread,-Bdynamic` | `libwinpthread-1.dll` のみ静的リンクし、以降は動的リンクに戻す |

`-static` (全体に適用) ではなく `-Wl,-Bstatic,...,-Bdynamic` を使う理由:
`-static` を単独で使うとすべての後続ライブラリが静的リンク対象になり、
システムライブラリ（`ws2_32` 等）に静的版がなければリンクエラーになる。

静的リンク後は実行時に MinGW の DLL を一切探索しないため、PATH の汚染に依存しない。

`opencascade-rs` のビルドスクリプトはすでに `-DBUILD_LIBRARY_TYPE=Static` を cmake に渡しており、OpenCASCADE 本体は静的ライブラリとしてリンクされている。したがって MinGW ランタイムも静的リンクすることで、外部 DLL への依存がゼロになる。

### バイナリサイズへの影響

静的リンクによりバイナリサイズは増加する（`libstdc++` 等が埋め込まれるため）が、
`opencascade-rs` 自体が大きいため相対的な増加率は小さい。

### 不採用とした代替案

| 案 | 内容 | 不採用理由 |
|---|---|---|
| PATH 修正 | Makefile で `PATH=/c/Users/smith/mingw64/bin:$$PATH cargo run` | 開発環境依存。CI や他メンバーのマシンで再発する |
| DLL コピー | ビルド後に正しい DLL を `target/debug/` へコピー | `cargo clean` で消える。CI で管理が複雑 |
| MSVC ターゲット (`windows-msvc`) | `ucrtbase.dll` (Windows 標準) のみに依存 | Visual Studio Build Tools が必要。cmake との連携設定コストが高い |

---

## 確認方法

修正後に `ldd` で DLL 依存を確認する:

```bash
# MinGW ランタイム DLL が消えていることを確認
ldd target/debug/api.exe | grep -E "libstdc|libgcc|libwinpthread"
# → 何も表示されなければ正常
```
