import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The models the public labs load (as their files in public/models). */
const MODELS: Record<'cmj' | 'rtmpose', string[]> = {
  cmj: ['pose_landmarker_lite.task', 'pose_landmarker_full.task', 'pose_landmarker_heavy.task', 'README.md'],
  rtmpose: ['rtmpose-m-halpe26-256x192.onnx', 'rtmpose-l-halpe26-384x288.onnx', 'rtmpose-l-halpe26-384x288.f16.bin', 'rtmpose-m-halpe26-384x288.onnx', 'README.md'],
};

export default defineConfig({
  root: resolve(import.meta.dirname, 'public-app'),
  base: process.env.DEPLOY_BASE_PATH || '/SACHIZU-LAB1/',
  publicDir: false,
  worker: { format: 'iife', rollupOptions: { output: { inlineDynamicImports: true } } },
  plugins: [react(), {
    name: 'public-model-allowlist',
    // `npm run dev` with this config (the exported public repo): the models served as the build emits them. With
    // publicDir off they were answered with index.html, and every analysis failed its model's check.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/models\/(cmj|rtmpose)\/([^/?#]+)/.exec(req.url ?? ''), name = m ? decodeURIComponent(m[2]) : '';
        if (!m || !MODELS[m[1] as 'cmj' | 'rtmpose'].includes(name)) return next();
        res.setHeader('Content-Type', name.endsWith('.md') ? 'text/markdown; charset=utf-8' : 'application/octet-stream');
        res.end(readFileSync(resolve(import.meta.dirname, 'public/models', m[1], name)));
      });
    },
    generateBundle() {
      for (const [dir, names] of Object.entries(MODELS)) for (const name of names) {
        this.emitFile({ type: 'asset', fileName: `models/${dir}/${name}`, source: readFileSync(resolve(import.meta.dirname, 'public/models', dir, name)) });
      }
      this.emitFile({ type: 'asset', fileName: 'licenses/onnxruntime-web.txt', source: readFileSync(resolve(import.meta.dirname, 'public-app/licenses/onnxruntime-web.txt')) });
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
