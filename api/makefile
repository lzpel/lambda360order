
ONLINE_URL=https://lycdbl4q53pdccqbtgwkuyo53i0uwvcw.lambda-url.us-east-1.on.aws
CONTENT_HASH=bf476c07bb0573c8b8a50b9093fea1b8de101e132b87b9e625bfa008a0d5c387
CONTENT_PATH=../public/PA-001-DF7.STEP

# --- DLL競合の回避 (STATUS_ENTRYPOINT_NOT_FOUND 0xc0000139) ---
# 症状: Git Bash から api.exe を起動すると STATUS_ENTRYPOINT_NOT_FOUND で即終了する。
# 原因: Git Bash は起動時に /mingw64/bin を PATH 先頭に自動挿入する。
#       このディレクトリには Git 付属バージョンの libgcc_s_seh-1.dll / libwinpthread-1.dll が含まれており、
#       x86_64-pc-windows-gnu ツールチェインがリンク時に想定したバージョンと異なる。
#       Windows の DLL 検索は PATH 順なので、Git の DLL が先にロードされてエントリポイント不一致が起きる。
#
# 対策: rustup のアクティブツールチェインの bin ディレクトリ
#   (~/.rustup/toolchains/stable-x86_64-pc-windows-gnu/bin)
# を PATH 先頭に置く。このディレクトリにはコンパイル時と同一バージョンの DLL が
# 同梱されているため、Git Bash の DLL より先に解決されて正しくロードされる。
# export により全ターゲットのサブシェルに継承される。
#
# 注意: `rustup which rustc` は Windows 形式パス (バックスラッシュ区切り) を返す。
#       そのまま dirname に渡すと "C:" しか得られないため、
#       cygpath -u -f - で MSYS2 形式 (/c/Users/...) に変換してから dirname する。
RUSTUP_BIN := $(shell rustup which rustc | cygpath -u -f - | xargs dirname)
export PATH := $(RUSTUP_BIN):$(PATH)

generate:
	cargo run --example generate
	cargo fmt

run:
	cargo run

test:
	cargo test

clean:
	rm -rf target Cargo.lock
	cargo clean

path:
	echo "$${PATH}"

test-online:
	ONLINE_URL=$(ONLINE_URL) cargo test -p api -- test_online_step_pipeline --include-ignored --nocapture

%:
	echo "No rule to make target '$@'"
