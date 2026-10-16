// Local static Pages emulator: missing files return the generated 404.html with HTTP 404.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../docs/', import.meta.url))
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:4174')
    if (!url.pathname.startsWith('/blog-front/')) {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    const name =
      decodeURIComponent(url.pathname.slice('/blog-front/'.length)) ||
      'index.html'
    const path = resolve(root, name)
    if (!path.startsWith(resolve(root) + sep)) {
      response.writeHead(403)
      response.end()
      return
    }
    const exists = await stat(path).then(
      (file) => file.isFile(),
      () => false,
    )
    const target = exists ? path : resolve(root, '404.html')
    response.writeHead(exists ? 200 : 404, {
      'Content-Type': types[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    response.end(await readFile(target))
  } catch {
    response.writeHead(500)
    response.end('Preview error')
  }
}).listen(4174, '127.0.0.1', () =>
  console.log('Pages emulator: http://127.0.0.1:4174/blog-front/'),
)
