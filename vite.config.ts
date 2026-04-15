import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        background: resolve(import.meta.dirname, 'src/background.ts'),
        options: resolve(import.meta.dirname, 'options.html'),
        popup: resolve(import.meta.dirname, 'popup.html'),
      },
      output: {
        entryFileNames: 'js/[name].js',
      },
    },
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
