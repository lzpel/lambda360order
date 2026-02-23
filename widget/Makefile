
generate:
	X=out/client && rm -rf $$X && mkdir -p $$X && cp -rf ../$$X/. $$X # out/clientを丸ごとコピー
	npm install

run:
	npm run dev

deploy:
	npm run build
	cp out/widget.js ../public/widget.js

dev:
	npm run dev
