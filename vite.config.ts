import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative Pfade: Die gebaute App funktioniert auch aus einem Unterordner.
  base: './',
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1500 },
  test: { environment: 'node' },
} as any);
