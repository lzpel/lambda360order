
generate:
	npm install
	# Build app (index.html)
	BUILD_MODE=app npm run build
	# Build library (widget.js)
	BUILD_MODE=lib npm run build
	# Deploy artifacts
	cp dist/widget.js ../public/widget.js
	rm -rf ../docs/dist
	cp -r dist ../docs/

run:
	# npm run preview

deploy:
	#

dev:
	npm run dev