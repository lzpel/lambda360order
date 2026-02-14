import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: '../public/openapi.json',
    output: {
        path: './src/out',
        clean: true,
    },
    plugins: [
        '@hey-api/typescript',
        '@hey-api/sdk',
        '@hey-api/client-fetch',
    ],
});
