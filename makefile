generate:
	npm install
	npm run build -- --webpack
run:
	npm run dev -- --webpack
action: generate
	echo ${NEXT_PUBLIC_REPO}