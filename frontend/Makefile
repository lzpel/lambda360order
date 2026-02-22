
generate:
	npm install
	npx @hey-api/openapi-ts
	rm -rf public && cp -r ../public public && echo "*" | install -D /dev/stdin public/.gitignore

run:
	npm run dev

deploy:
	npm run build
	rm -rf ../$(OUT_FRONTEND_DIR) && mkdir -p ../$(OUT_FRONTEND_DIR) && cp -r ./out/. ../$(OUT_FRONTEND_DIR)

dev:
	npm run dev
