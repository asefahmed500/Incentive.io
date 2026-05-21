import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.claude/**',
      '**/.agents/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'tests/e2e/specs/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/middleware.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
