
generate:
	cargo run --example generate
	cargo fmt

run:
	cargo run

deploy:
	X=out && rm -rf $$X && mkdir -p $$X && cp -r ../frontend/$$X/. $$X 

test:
	cargo test

clean:
	rm -rf target Cargo.lock
	cargo clean

push:
	docker build --no-cache -t lzpel/chijin-builder -f DockerfileAsBuilder .
	docker push lzpel/chijin-builder

image:
	docker build -t lambda360form .

test-online:
	cargo test -p api -- test_online_step_pipeline --include-ignored --nocapture

test-stretch:
	cargo test stretch_test_1_0_10 -- --ignored --nocapture
	cargo test stretch_known_error_case_100_100_75 -- --ignored --nocapture

# deep_copy 回帰テスト（外部 STEP ファイル不要）
# box_same_params / l_shape / cylinder_hole は通常テストに昇格済み（#[ignore] 削除）
# direct_bool_chain / early_drop は raw C++ 動作確認用のため引き続き --ignored で実行
bench-stretch:
	cargo test bench_stretch_timing -- --ignored --nocapture

test-stretch-minimal:
	cargo test heap_corruption_box_same_params -- --nocapture
	cargo test heap_corruption_direct_bool_chain -- --ignored --nocapture
	cargo test heap_corruption_early_drop -- --ignored --nocapture
	cargo test heap_corruption_l_shape -- --nocapture
	cargo test heap_corruption_cylinder_hole -- --nocapture

%:
	echo "No rule to make target '$@'"
