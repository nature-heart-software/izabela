import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: [
      'packages/**/*.spec.{ts,mts}',
      'apps/app-server/**/*.spec.{ts,mts}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'packages/**/src/**/*.{ts,vue}',
        'packages/*/index.js',
        'apps/app-server/src/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/vite-env.d.ts',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
})
