generate:
	# github pagesにはmandolinは無いので放置
	mandolin -h && mandolin -i ../public/openapi.json -o src/openapi.rs || echo "mandolin not found"

run:
	cargo run

test:
	docker build -t lambda360order .
