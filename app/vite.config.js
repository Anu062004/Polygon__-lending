import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to suppress Lit warnings
const suppressLitWarnings = () => {
  return {
    name: 'suppress-lit-warnings',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Suppress Lit dev mode warnings in console
        if (req.url?.includes('.js')) {
          res.setHeader('X-Content-Type-Options', 'nosniff')
        }
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), suppressLitWarnings()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    // Suppress Lit development mode warnings
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.LIT_DEV_MODE': 'false'
  }
})



