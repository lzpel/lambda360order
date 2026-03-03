import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      plugins: [
        react(),
        tsconfigPaths(),
        dts({
          include: ['src', 'out/client'],
          outDir: 'dist/esm',
          entryRoot: '.',
          insertTypesEntry: true,
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/Lambda360Form.tsx'),
          formats: ['es'],
          fileName: () => 'index.js',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
        outDir: 'dist/esm',
        emptyOutDir: true,
      },
    };
  }

  return {
    plugins: [
      react(),
      tsconfigPaths(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/widget-entry.tsx'),
        name: 'Lambda360',
        formats: ['iife'],
        fileName: () => 'lambda360form.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
      cssCodeSplit: false,
    },
  };
});
