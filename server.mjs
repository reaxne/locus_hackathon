import express from 'express'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

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
app.use('/assets', express.static(`${dist}/assets`, { immutable: true, maxAge: '1y' }))
app.use(express.static(dist, { maxAge: 0 }))
app.get('/{*path}', (req, res) => {
  if (!req.accepts('html') || /\.[a-z0-9]+$/i.test(req.path)) return res.status(404).send('Not found')
  res.sendFile(`${dist}/index.html`)
})
const port = Number(process.env.PORT || 3000)
const server = app.listen(port, '0.0.0.0', () => console.log(`Vector is listening on port ${port}`))
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  })
