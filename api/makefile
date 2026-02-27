
ONLINE_URL=https://lycdbl4q53pdccqbtgwkuyo53i0uwvcw.lambda-url.us-east-1.on.aws
CONTENT_HASH=bf476c07bb0573c8b8a50b9093fea1b8de101e132b87b9e625bfa008a0d5c387
CONTENT_PATH=../public/PA-001-DF7.STEP

# --- DLL競合の回避 (STATUS_ENTRYPOINT_NOT_FOUND 0xc0000139) ---
# 症状: Git Bash から api.exe を起動すると STATUS_ENTRYPOINT_NOT_FOUND で即終了する。
# 原因: api.exe は libstdc++-6.dll を動的インポートする (opencascade-rs が C++ を使うため)。
#       Git Bash は起動時に /mingw64/bin (Git 付属の古い MinGW) を PATH 先頭に挿入する。
#       そのため Windows の DLL 検索がコンパイルに使った GCC (~/mingw64/bin, v15.2.0) と
#       バージョンの異なる libstdc++-6.dll / libgcc_s_seh-1.dll を先にロードしてしまい、
#       エントリポイント不一致 (STATUS_ENTRYPOINT_NOT_FOUND) で起動失敗する。
#
# 対策: `which gcc` でコンパイルに使った GCC の bin ディレクトリを取得し、PATH 先頭に置く。
#       これによりコンパイル時と同一バージョンの DLL が確実に先に解決される。
#       export により全ターゲットのサブシェルに継承される。
COMPILER_BIN := $(shell dirname $(shell which gcc))
export PATH := $(COMPILER_BIN):$(PATH)

generate:
	cargo run --example generate
	cargo fmt

run:
	cargo build
	# `cargo run` ではなく直接起動する理由:
	# make.exe はネイティブ Windows PE バイナリのため、cargo 経由で api.exe を起動すると
	# MSYS2 のパス変換が適切に機能せず DLL 検索で COMPILER_BIN が無視される。
	# bash (MSYS2) が直接 api.exe を起動する場合は PATH が Windows 形式に変換されて
	# C:\Users\smith\mingw64\bin が先頭に来るため、正しい DLL がロードされる。
	PATH="$(COMPILER_BIN):$$PATH" ./target/debug/api.exe

test:
	PATH="$(COMPILER_BIN):$$PATH" cargo test

clean:
	rm -rf target Cargo.lock
	cargo clean

path:
	echo "$${PATH}"

test-online:
	PATH="$(COMPILER_BIN):$$PATH" ONLINE_URL=$(ONLINE_URL) cargo test -p api -- test_online_step_pipeline --include-ignored --nocapture

test-stretch:
	PATH="$(COMPILER_BIN):$$PATH" cargo test stretch_test_1_0_10 -- --ignored --nocapture
	PATH="$(COMPILER_BIN):$$PATH" cargo test stretch_known_error_case_100_100_75 -- --ignored --nocapture

# deep_copy 回帰テスト（外部 STEP ファイル不要）
# box_same_params / l_shape / cylinder_hole は通常テストに昇格済み（#[ignore] 削除）
# direct_bool_chain / early_drop は raw C++ 動作確認用のため引き続き --ignored で実行
bench-stretch:
	PATH="$(COMPILER_BIN):$$PATH" cargo test bench_stretch_timing -- --ignored --nocapture

test-stretch-minimal:
	PATH="$(COMPILER_BIN):$$PATH" cargo test heap_corruption_box_same_params -- --nocapture
	PATH="$(COMPILER_BIN):$$PATH" cargo test heap_corruption_direct_bool_chain -- --ignored --nocapture
	PATH="$(COMPILER_BIN):$$PATH" cargo test heap_corruption_early_drop -- --ignored --nocapture
	PATH="$(COMPILER_BIN):$$PATH" cargo test heap_corruption_l_shape -- --nocapture
	PATH="$(COMPILER_BIN):$$PATH" cargo test heap_corruption_cylinder_hole -- --nocapture

%:
	echo "No rule to make target '$@'"
