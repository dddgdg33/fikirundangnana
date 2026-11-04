import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function fontFallbackPlugin(): Plugin {
  return {
    name: 'font-fallback-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url?.split('?')[0].split('#')[0] || ''
        if (rawUrl.match(/\.(woff2?|ttf|otf|eot)$/i)) {
          const fileName = path.basename(rawUrl)
          const candidates = [
            path.resolve(__dirname, 'public/wp-content/uploads/useanyfont', fileName),
            path.resolve(__dirname, 'public/templates/_shared/remote/wp-content/uploads/elementor/google-fonts/fonts', fileName),
            ...['heritage-aruna', 'heritage-sandhayu', 'heritage-utary', 'premium-01', 'premium-02', 'premium-danila', 'premium-flara', 'premium-ivanna', 'premium-kila'].map(t => path.resolve(__dirname, `public/templates/${t}/fonts`, fileName)),
          ]
          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              const ext = path.extname(candidate).toLowerCase()
              const mime = ext === '.woff2' ? 'font/woff2' : ext === '.woff' ? 'font/woff' : 'application/octet-stream'
              res.setHeader('Content-Type', mime)
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Cache-Control', 'public, max-age=31536000')
              return fs.createReadStream(candidate).pipe(res)
            }
          }
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fontFallbackPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
