generate:
	npm install
	echo "$${tspconfig}" > ./out.yaml
	npm run tsp -- compile main.tsp --config ./out.yaml
%:
	echo "No rule to make target '$@'"

define tspconfig
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: "{project-root}/../public/openapi.json"
endef
export