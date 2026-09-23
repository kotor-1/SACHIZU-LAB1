import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(import.meta.dirname, 'public-app'),
  base: process.env.DEPLOY_BASE_PATH || '/SACHIZU-LAB1/',
  publicDir: false,
  worker: { format: 'iife', rollupOptions: { output: { inlineDynamicImports: true } } },
  plugins: [react(), {
    name: 'public-model-allowlist',
    generateBundle() {
      for (const name of ['pose_landmarker_lite.task', 'pose_landmarker_full.task', 'README.md']) {
        this.emitFile({ type: 'asset', fileName: `models/cmj/${name}`, source: readFileSync(resolve(import.meta.dirname, 'public/models/cmj', name)) });
      }
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
      this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_NOTICES.md', source: readFileSync(resolve(import.meta.dirname, 'public-app/THIRD_PARTY_NOTICES.md')) });
      for (const [name, path] of Object.entries({ react: 'react/LICENSE', 'react-dom': 'react-dom/LICENSE', scheduler: 'scheduler/LICENSE', 'lucide-react': 'lucide-react/LICENSE', mp4box: 'mp4box/LICENSE', 'Apache-2.0': 'typescript/LICENSE.txt' })) {
        this.emitFile({ type: 'asset', fileName: `licenses/${name}.txt`, source: readFileSync(resolve(import.meta.dirname, 'node_modules', path)) });
      }
    },
  }],
  build: { outDir: resolve(import.meta.dirname, 'dist-public'), emptyOutDir: true, sourcemap: false },
  preview: { host: '127.0.0.1', port: 4186, strictPort: true },
});
