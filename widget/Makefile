
generate:
	X=out/client && rm -rf $$X && mkdir -p $$X && cp -rf ../$$X/. $$X # out/clientを丸ごとコピー
	npm install

run:
	npm run dev

deploy:
	npm run build
	install -D out/out/widget.js -t ../out/public

publish:
	# https://unpkg.com/lambda360form@latest/dist/lambda360form.js
	npm publish

dev:
	npm run dev
