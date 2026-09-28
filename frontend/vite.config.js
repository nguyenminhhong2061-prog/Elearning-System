import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { mockApi } from './mock/mockApi.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // `npm run dev:mock` (mode "mock") serves the module A API (docs/api/) from sample data until the backend has it.
    plugins: [react(), tailwindcss(), mode === 'mock' && mockApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // The backend has no CORS configuration, so during development the browser talks to this dev server
      // (same origin) and Vite forwards /api to Spring Boot. Nothing changes in the backend.
      proxy: {
        '/api': {
          target: env.DEV_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        // Listening/reference audio is served by Spring from resources/static/media.
        '/media': {
          target: env.DEV_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
      include: ['src/**/*.test.{js,jsx}', 'mock/**/*.test.js'],
      // Full-flow tests type with user-event (one key at a time) and wait for debounced searches; with every file
      // running in parallel they can pass the 5s default.
      testTimeout: 15000,
    },
  }
})
