# STEP 読み込みのキャッシュについて

## 問題

`Shape::read_step()` は STEP ファイルのパース → B-Rep 変換に非常に時間がかかる。
PA-001-DF7.STEP (6.1MB) で数十秒〜数分かかる場合がある。

## OpenCascade (C++) が持つキャッシュ手段

OCCT 本体には B-Rep 形状をシリアライズする仕組みが3つある：

### 1. BREP テキスト形式 (`BRepTools::Write` / `BRepTools::Read`)

```cpp
#include <BRepTools.hxx>
#include <BRep_Builder.hxx>

// 書き出し
BRepTools::Write(shape, "cache.brep");

// 読み込み
BRep_Builder builder;
TopoDS_Shape shape;
BRepTools::Read(shape, "cache.brep", builder);
```

- テキスト形式で人間が読める
- STEP パースをスキップして B-Rep を直接復元
- 読み込み速度は STEP の **10〜100倍高速**
- ファイルサイズは STEP より大きくなる傾向

### 2. BREP バイナリ形式 (`BinTools::Write` / `BinTools::Read`)

```cpp
#include <BinTools.hxx>

// 書き出し
BinTools::Write(shape, "cache.brep.bin");

// 読み込み
TopoDS_Shape shape;
BinTools::Read(shape, "cache.brep.bin");
```

- バイナリ形式でさらにコンパクト・高速
- テキスト BREP の 2〜3 倍速い読み込み

### 3. XCAF (XDE) ドキュメント形式

- 色・レイヤー・アセンブリ構造を含む完全なキャッシュ
- 今回のユースケースでは過剰

## opencascade-rs での現状

**opencascade-rs (v0.2) には BREP 読み書きのバインディングが存在しない。**

ソースコード調査結果：
- `wrapper.hxx` に `#include <BRepTools.hxx>` はあるが `BRepTools::OuterWire` のみバインド
- `BRepTools::Write` / `BRepTools::Read` のFFIバインディングは未実装
- `BinTools` のバインディングも無し

## 現時点で可能な回避策

### A. STEP → STEP キャッシュ（効果なし）
`write_step` → `read_step` は同じパースコストがかかるので意味がない。

### B. STL をキャッシュとして使う（形状情報が失われる）

```rust
// 初回: STEP → STL
let shape = Shape::read_step("model.step")?;
shape.write_stl_with_tolerance("cache.stl", 0.1)?;
```

STL は三角形メッシュのみで B-Rep トポロジー（面・エッジの境界情報）が失われるため、
再加工や正確なエッジ抽出ができなくなる。表示専用なら可。

### C. opencascade-sys に BREP バインディングを追加する（推奨・要実装）

`wrapper.hxx` に以下を追加すれば BREP キャッシュが実現できる：

```cpp
// wrapper.hxx に追加
#include <BRep_Builder.hxx>

inline bool write_brep(const TopoDS_Shape& shape, const std::string& path) {
    return BRepTools::Write(shape, path.c_str());
}

inline bool read_brep(TopoDS_Shape& shape, const std::string& path) {
    BRep_Builder builder;
    return BRepTools::Read(shape, path.c_str(), builder);
}
```

```rust
// lib.rs (opencascade-sys) に追加
pub fn write_brep(shape: &TopoDS_Shape, path: String) -> bool;
pub fn read_brep(shape: Pin<&mut TopoDS_Shape>, path: String) -> bool;
```

```rust
// shape.rs (opencascade) に追加
impl Shape {
    pub fn write_brep(&self, path: impl AsRef<Path>) -> Result<(), Error> { ... }
    pub fn read_brep(path: impl AsRef<Path>) -> Result<Self, Error> { ... }
}
```

### D. キャッシュ付きローダーのパターン（C案を実装した場合）

```rust
use std::path::Path;

fn load_with_cache(step_path: &Path) -> Shape {
    let cache_path = step_path.with_extension("brep");

    if cache_path.exists() {
        // BREP キャッシュから高速読み込み
        println!("Loading from BREP cache...");
        Shape::read_brep(&cache_path).unwrap()
    } else {
        // 初回: STEP を読み込んで BREP キャッシュを保存
        println!("Reading STEP (first time, creating cache)...");
        let shape = Shape::read_step(step_path).unwrap();
        shape.write_brep(&cache_path).unwrap();
        shape
    }
}
```

## まとめ

| 方式 | 速度 | 形状情報 | 実装状況 |
|------|------|----------|----------|
| STEP (パース) | 遅い (基準) | 完全 | `Shape::read_step` で利用可 |
| BREP テキスト | 10-100x 速い | 完全 | **未実装** (FFI追加が必要) |
| BREP バイナリ | 20-200x 速い | 完全 | **未実装** (FFI追加が必要) |
| STL キャッシュ | 速い | メッシュのみ | `Shape::write_stl` で利用可 |

## ハック vs フォーク：実際に試した結論

### 試したハック手法とその結果

#### ハック1: `extern "C"` + `cc` crate で独自 C++ ラッパー

自前の `brep_io.cpp` を `cc` クレートでコンパイルし、`extern "C"` で Rust から呼ぶ方式。

```
brep_io.a → BRepTools::Write/Read を呼ぶ
             ↓ OCCT シンボル参照
opencascade-sys rlib → 既に TKBRep 等をリンク済み
```

**問題: リンク順序。** `brep_io.a` が link コマンドで OCCT ライブラリより前に配置され、
`Standard_Transient::DecrementRefCounter` 等が未解決シンボルになる。

**修正試行:**
- TK* ライブラリを `cargo:rustc-link-lib` で再リンク → **重複シンボルエラー**
- `--allow-multiple-definition` を追加 → **コンパイルは通るが実行時クラッシュ**
  - C++ の static initializer が2重実行され `free(): invalid pointer` で abort
  - OCCT は `Standard::Allocate` 等のグローバルアロケータを static init で登録しており、
    2重登録でヒープが破壊される

#### ハック2: `opencascade_sys::ffi` 直接使用 + `transmute`

`Shape.inner` は `pub(crate)` でアクセス不可のため、
`std::mem::transmute` で `&Shape` → `&UniquePtr<TopoDS_Shape>` に変換してポインタを取得。

**問題:** ハック1と同じリンク順序問題が残り、同じクラッシュ。
transmute 自体は動く可能性があるが、リンク問題の前に検証できなかった。

#### ハック3（最終的にたどり着いた方法）: `[patch]` でローカルパッチ

```toml
[patch."https://github.com/bschwind/opencascade-rs"]
opencascade-sys = { path = "patches/opencascade-sys" }
```

opencascade-sys のソースをローカルにコピーし、`wrapper.hxx` と `lib.rs` に
`write_brep` / `read_brep` を追加。cxx bridge 経由なのでリンク問題なし。

### 結論: フォーク（または `[patch]`）が筋の良い方法

| 観点 | ハック (`extern "C"` + `cc`) | フォーク / `[patch]` |
|------|------------------------------|---------------------|
| リンク問題 | **致命的** — static lib の順序依存で未解決 or 重複 | **なし** — cxx bridge に統合されるため |
| ランタイム安全性 | `--allow-multiple-definition` で static init 二重実行→クラッシュ | 安全 |
| コード量 | `build.rs` + C++ ラッパー + `extern "C"` 宣言 | wrapper.hxx に2関数 + lib.rs に2行 |
| 保守性 | リンカーフラグへの依存が脆い | cxx の型安全な FFI |
| transmute の必要性 | `Shape.inner` が `pub(crate)` のため必要 | 不要 — ffi 関数が直接使える |

**理由のまとめ:**

1. **C++ スタティックライブラリのリンク順序問題は Cargo では制御できない。**
   `cargo:rustc-link-lib` で追加したライブラリは link コマンドの特定の位置に挿入されるが、
   その位置は rlib 内の OCCT シンボルと競合する。

2. **`--allow-multiple-definition` は C++ では危険。**
   C では比較的安全だが、C++ の static initializer/destructor、vtable、
   テンプレートインスタンスが重複すると未定義動作になる。

3. **cxx bridge に統合するのが正解。**
   `wrapper.hxx` に inline 関数を足して `lib.rs` に宣言を足すだけ。
   OCCT ライブラリは opencascade-sys が既にリンクしているので追加設定不要。
   `[patch]` を使えば GitHub 上の fork すら不要でローカル完結する。

### 推奨アクション

1. **短期:** `[patch]` でローカルパッチ（本リポジトリの `patches/opencascade-sys/`）
2. **中期:** GitHub で fork して `write_brep` / `read_brep` を追加
3. **長期:** upstream に PR を出す（`BRepTools::Write/Read` は汎用的で採用されやすい）
