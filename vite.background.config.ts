import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(projectRoot, 'src/background/service-worker.ts'),
      formats: ['es'],
      fileName: () => 'service-worker.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
