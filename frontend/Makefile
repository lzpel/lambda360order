
generate:
	npm install
	# Build app (index.html)
	BUILD_MODE=app npm run build
	# Build library (widget.js)
	BUILD_MODE=lib npm run build
	# Deploy artifacts
	cp dist/widget.js ../public/widget.js

run:
	npm run dev

deploy:
	#

dev:
	npm run dev