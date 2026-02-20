export CMAKE_POLICY_VERSION_MINIMUM=3.5
generate:
	cargo run --example generate
	cargo fmt

run:
	cargo run

test:
	docker build -t lambda360order .

%:
	echo "No rule to make target '$@'"
