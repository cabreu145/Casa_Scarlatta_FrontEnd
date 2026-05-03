import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [react(), uploadFotoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
