
generate:
	mkdir -p ./public
	rm -rf ./public/*
	cp -r ../public/* ./public/
	npm install
	npm run build -- --webpack

run:
	npm run dev -- --webpack

build:
	npm run build -- --webpack

deploy:
	npm run start

action: generate
	echo ${NEXT_PUBLIC_REPO}
