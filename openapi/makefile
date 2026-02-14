generate:
	npm install
	echo "$${tspconfig}" > ./out.yaml
	npm run tsp -- compile main.tsp --config ./out.yaml

define tspconfig
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: "{project-root}/../public/openapi.json"
endef
export