import assert from 'node:assert/strict'
import { readFile, access, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, sep } from 'node:path'

const root = fileURLToPath(new URL('../../docs/', import.meta.url))
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const fallback = await readFile(resolve(root, '404.html'), 'utf8')
await access(resolve(root, '.nojekyll'))
assert(!html.includes('/src/main.js'), 'Source entry cannot be deployed directly')
assert(fallback.includes("var base = '/blog-front/'"), '404 base mismatch')
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => !/^(?:https?:|data:|#)/.test(url))
assert(references.some((url) => /\/assets\/.*\.js$/.test(url)), 'Missing built entry')
for (const url of references) {
  assert(url.startsWith('/blog-front/'), 'Asset outside deployment prefix')
  const path = resolve(root, decodeURIComponent(url.slice('/blog-front/'.length)))
  assert(path.startsWith(resolve(root) + sep), 'Asset escaped build directory')
  await access(path)
}
const scripts = (await readdir(resolve(root, 'assets'))).filter((name) => name.endsWith('.js'))
for (const name of scripts) {
  const source = await readFile(resolve(root, 'assets', name), 'utf8')
  for (const marker of ['devblog_mock_studio_v1', 'devblog_mock_content_v1', 'DEVELOPMENT STUDIO MOCK']) {
    assert(!source.includes(marker), 'Development mock included in production: ' + name)
  }
}
const marker = await stat(resolve(root, '.nojekyll'))
assert(marker.isFile(), 'Missing .nojekyll file')
console.log(JSON.stringify({suite:'pages-build',passed:true,base:'/blog-front/',nojekyll:true,entryAssets:references.length,productionScripts:scripts.length,mockIncluded:false}))
