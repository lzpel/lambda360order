
generate:
	npm install

run:
	npm run dev

deploy:
	# Build app (index.html)
	BUILD_MODE=app npm run build
	# Build library (widget.js)
	BUILD_MODE=lib npm run build
	# Deploy artifacts
	cp out/widget.js ../public/widget.js

dev:
	npm run dev