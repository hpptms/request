import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Proxy /api to the Go backend during `npm run dev` so the frontend can
// always call the relative path "/api/...", matching how the Docker/nginx
// setup serves both from the same origin in production.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || '8090'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://localhost:${backendPort}`,
      },
    },
  }
})
