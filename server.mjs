import express from 'express'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'

const app = express()
const dist = fileURLToPath(new URL('./dist/', import.meta.url))
if (!existsSync(`${dist}/index.html`)) throw new Error('Build missing. Run npm run build first.')
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
// Transport only: all authentication and data access live in Python.
app.use('/api', (req, res) => {
  const target = new URL(
    req.originalUrl.replace(/^\/api(?=\/)/, ''),
    process.env.API_UPSTREAM || 'http://127.0.0.1:8000',
  )
  const proxy = (target.protocol === 'https:' ? https : http).request(
    target,
    {
      method: req.method,
      headers: { ...req.headers, host: target.host },
      timeout: req.originalUrl.startsWith('/api/ai/') ? 90000 : 20000,
    },
    (upstream) => {
      res.writeHead(upstream.statusCode || 502, upstream.headers)
      upstream.pipe(res)
    },
  )
  proxy.on('timeout', () => proxy.destroy())
  req.on('aborted', () => proxy.destroy())
  res.on('close', () => {
    if (!res.writableEnded) proxy.destroy()
  })
  proxy.on('error', () => {
    if (!res.headersSent) res.status(502).json({ detail: 'Python API unavailable' })
    else res.end()
  })
  req.pipe(proxy)
})
app.use('/assets', express.static(`${dist}/assets`, { immutable: true, maxAge: '1y' }))
app.use(express.static(dist, { maxAge: 0 }))
app.get('/{*path}', (req, res) => {
  if (!req.accepts('html') || /\.[a-z0-9]+$/i.test(req.path)) return res.status(404).send('Not found')
  res.sendFile(`${dist}/index.html`)
})
const port = Number(process.env.PORT || 3000)
const server = app.listen(port, '0.0.0.0', () => console.log(`Static site is listening on port ${port}`))
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  })
