import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 300000, // 5 minutes for slow tests on unfixed code
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
