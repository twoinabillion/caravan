import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, '서울까지400km.html'),
      },
    },
  },
});
