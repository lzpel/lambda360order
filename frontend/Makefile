
generate:
	npm install
	X=out/client && rm -rf $$X && mkdir -p $$X && cp -rf ../$$X/. $$X # out/clientを丸ごとコピー
	npx tsx app/examples.ts

run:
	npm run dev

deploy:
	npm run build

dev:
	npm run dev
