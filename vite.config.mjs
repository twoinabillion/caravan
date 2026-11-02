import { existsSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { prepareAppShell } from './tools/prepare-app-shell.mjs';

import { parkEmbeddedAssets, restoreEmbeddedAssets } from './tools/vite-embedded-assets.mjs';

let parkedAssets;
export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'ait-direct-index',
      apply: 'build',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          parkedAssets = parkEmbeddedAssets(html);
          return parkedAssets.html;
        },
      },
      closeBundle() {
        const builtGame = resolve(import.meta.dirname, 'dist', '서울까지400km.html');
        const builtIndex = resolve(import.meta.dirname, 'dist', 'index.html');
        if (existsSync(builtGame)) {
          if (!parkedAssets) throw Error('Embedded asset parking did not run');
          writeFileSync(builtGame, restoreEmbeddedAssets(readFileSync(builtGame, 'utf8'), parkedAssets));
          renameSync(builtGame, builtIndex);
        }
        prepareAppShell(import.meta.dirname, resolve(import.meta.dirname, 'dist'));
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
