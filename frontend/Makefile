
generate:
	npm install
	X=out/client && rm -rf $$X && mkdir -p $$X && cp -rf ../$$X/. $$X # out/clientを丸ごとコピー
	rm -rf public && cp -r ../public public && echo "*" | install -D /dev/stdin public/.gitignore

run:
	npm run dev

deploy:
	X=public && rm -rf $$X && mkdir -p $$X && cp -r ../out/$$X/. $$X
	npm run build

dev:
	npm run dev
