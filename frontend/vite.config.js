import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// ── Plugin: guarda fotos de coaches en public/fotos/ ─────────────────────────
function uploadFotoPlugin() {
  return {
    name: 'upload-foto',
    configureServer(server) {
      server.middlewares.use('/api/upload-foto', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { base64, filename } = JSON.parse(body)
            const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
            const buffer = Buffer.from(base64Data, 'base64')
            const fotosDir = path.resolve(__dirname, 'public/fotos')
            if (!fs.existsSync(fotosDir)) fs.mkdirSync(fotosDir, { recursive: true })
            fs.writeFileSync(path.join(fotosDir, filename), buffer)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: `/fotos/${filename}` }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = String(env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').trim()
  const isNgrokTarget = /ngrok-free\.app/i.test(apiTarget)
  const ngrokHeaders = isNgrokTarget ? { 'ngrok-skip-browser-warning': 'true' } : undefined

  return {
    plugins: [react(), uploadFotoPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: ['3104-189-176-134-126.ngrok-free.app', 'localhost'],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ...(ngrokHeaders ? { headers: ngrokHeaders } : {}),
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ...(ngrokHeaders ? { headers: ngrokHeaders } : {}),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setupTests.js',
      css: true,
      globals: true,
    },
  }
})
