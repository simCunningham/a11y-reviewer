import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app lives in client/ and builds to dist/, which Express serves.
// In development, `npm run dev` proxies API calls to the Express server on port 3000.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
