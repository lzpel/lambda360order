export CMAKE_POLICY_VERSION_MINIMUM=3.5
generate:
	cargo run --example generate
	cargo fmt
	cargo test -p api -- generate_glb --include-ignored

run:
	cargo run

test:
	cargo test shape


%:
	echo "No rule to make target '$@'"
