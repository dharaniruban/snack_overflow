import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': apiTarget,
      '/snacks': apiTarget,
      '/activity': apiTarget,
      '/health': apiTarget,
    },
  },
});
