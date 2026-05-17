import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/minecraft': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    nodePolyfills({
      include: ['buffer', 'zlib', 'stream', 'util'],
      globals: {
        Buffer: true,
      },
    }),
  ]
});