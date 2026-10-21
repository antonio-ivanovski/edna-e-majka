import { defineConfig } from 'vitest/config'

import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': fileURLToPath(new URL('./src/test/cloudflare-workers-mock.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    passWithNoTests: true,
  },
})
