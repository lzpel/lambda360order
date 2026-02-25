export CMAKE_POLICY_VERSION_MINIMUM=3.5
ONLINE_URL=https://lycdbl4q53pdccqbtgwkuyo53i0uwvcw.lambda-url.us-east-1.on.aws
CONTENT_HASH=bf476c07bb0573c8b8a50b9093fea1b8de101e132b87b9e625bfa008a0d5c387
CONTENT_PATH=../public/PA-001-DF7.STEP
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

test-online:
	ONLINE_URL=$(ONLINE_URL) cargo test -p api -- test_online_step_pipeline --include-ignored --nocapture

%:
	echo "No rule to make target '$@'"
