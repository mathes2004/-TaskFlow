import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Same policy Nginx sends in production (deploy/nginx/taskflow.conf); applied to `vite preview`
// so the built bundle can be checked locally. Not applied to the dev server (HMR needs inline code).
const previewHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' http://localhost:8000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/, so the Pages workflow sets VITE_BASE. Default: /
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true, host: 'localhost' },
  preview: { port: 5173, strictPort: true, host: 'localhost', headers: previewHeaders },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    testTimeout: 30000, // UI click-through tests are slower on shared CI runners
    env: { VITE_USE_MOCK: 'true', VITE_API_URL: '' }, // exercise the demo API the Pages build ships
  },
});
