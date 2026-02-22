
generate:
	npm install
	npx @hey-api/openapi-ts
	rm -rf public && cp -r ../public public && echo "*" | install -D /dev/stdin public/.gitignore

run:
	npm run dev

deploy:
	npm run build

dev:
	npm run dev
