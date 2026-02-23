
generate:
	npm install
	X=out/client && rm -rf $$X && mkdir -p $$X && cp -rf ../$$X/. $$X # out/clientを丸ごとコピー
	rm -rf public && cp -r ../public public && echo "*" | install -D /dev/stdin public/.gitignore

run:
	npm run dev

deploy:
	npm run build
	rm -rf ../$(PATH_OUT_FRONTEND) && mkdir -p ../$(PATH_OUT_FRONTEND) && cp -r ./out/. ../$(PATH_OUT_FRONTEND)

dev:
	npm run dev
