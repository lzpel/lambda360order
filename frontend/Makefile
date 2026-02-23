
generate:
	npm install
	npx @hey-api/openapi-ts
	rm -rf public && cp -r ../public public && echo "*" | install -D /dev/stdin public/.gitignore

run:
	npm run dev

deploy:
	npm run build
	rm -rf ../$(PATH_OUT_FRONTEND) && mkdir -p ../$(PATH_OUT_FRONTEND) && cp -r ./out/. ../$(PATH_OUT_FRONTEND)

dev:
	npm run dev
