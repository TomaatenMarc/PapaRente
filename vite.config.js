import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hotel: resolve(__dirname, 'hotel.html'),
        planwagen: resolve(__dirname, 'planwagen.html'),
      },
    },
  },
});
