generate:
	npm install
	echo "$${tspconfig}" > ./out.yaml
	npm run tsp -- compile main.tsp --config ./out.yaml
	echo "$${openapi_ts}" > ./out.ts
	npm run openapi-ts -- --file ./out.ts
%:
	echo "No rule to make target '$@'"

define tspconfig
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: "{project-root}/../out/openapi.json"
endef
export

define openapi_ts
import { defineConfig } from '@hey-api/openapi-ts';
export default defineConfig({
    input: '../out/openapi.json',
    output: {
        path: '../out/client',
        clean: true,
    },
    plugins: [
        '@hey-api/typescript',
        '@hey-api/sdk',
        '@hey-api/client-fetch',
    ],
});
endef
export