import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'ait-direct-index',
      closeBundle() {
        const builtGame = resolve(import.meta.dirname, 'dist', '서울까지400km.html');
        const builtIndex = resolve(import.meta.dirname, 'dist', 'index.html');
        if (existsSync(builtGame)) renameSync(builtGame, builtIndex);
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, '서울까지400km.html'),
    },
  },
});
