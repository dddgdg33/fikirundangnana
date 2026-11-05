import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const FONT_TEMPLATES = ['heritage-aruna', 'heritage-sandhayu', 'heritage-utary', 'premium-01', 'premium-02', 'premium-danila', 'premium-flara', 'premium-ivanna', 'premium-kila']
const FONT_EXT_RE = /\.(woff2?|ttf|otf|eot)$/i

function findFontCandidate(fileName: string): string | undefined {
  const candidates = [
    path.resolve(__dirname, 'public/wp-content/uploads/useanyfont', fileName),
    path.resolve(__dirname, 'public/templates/_shared/remote/wp-content/uploads/elementor/google-fonts/fonts', fileName),
    ...FONT_TEMPLATES.map(t => path.resolve(__dirname, `public/templates/${t}/fonts`, fileName)),
  ]
  return candidates.find(c => fs.existsSync(c))
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(css|html|js|json)$/i.test(entry.name)) out.push(full)
  }
  return out
}

function fontFallbackPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'font-fallback-plugin',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    // In production there is no dev middleware, so copy every referenced font
    // that only exists in a template's fonts/ folder to the exact URL path the
    // template CSS expects. Otherwise those requests 404 on the deployed site.
    writeBundle() {
      const refRe = /\/(?:templates\/_shared\/remote\/)?wp-content\/[^"')?#\s]+/g
      const refs = new Set<string>()
      for (const file of walk(path.resolve(__dirname, 'public/templates'))) {
        for (const m of fs.readFileSync(file, 'utf8').matchAll(refRe)) {
          if (FONT_EXT_RE.test(m[0])) refs.add(m[0])
        }
      }
      for (const ref of refs) {
        let urlPath: string
        try { urlPath = decodeURIComponent(ref) } catch { continue }
        const target = path.join(outDir, urlPath)
        if (!target.startsWith(outDir + path.sep) || fs.existsSync(target)) continue
        const source = findFontCandidate(path.basename(urlPath))
        if (!source) continue
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.copyFileSync(source, target)
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url?.split('?')[0].split('#')[0] || ''
        if (FONT_EXT_RE.test(rawUrl)) {
          const candidate = findFontCandidate(path.basename(rawUrl))
          if (candidate) {
            const ext = path.extname(candidate).toLowerCase()
            const mime = ext === '.woff2' ? 'font/woff2' : ext === '.woff' ? 'font/woff' : 'application/octet-stream'
            res.setHeader('Content-Type', mime)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'public, max-age=31536000')
            return fs.createReadStream(candidate).pipe(res)
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
