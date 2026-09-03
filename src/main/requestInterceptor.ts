import { session } from 'electron'
import { promises as fs } from 'fs'
import { extname } from 'path'
import { SiteCache } from './siteCache'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.frag': 'text/plain',
  '.bin': 'application/octet-stream',
  '.symbols': 'text/plain'
}

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export function setupRequestInterceptor(siteCache: SiteCache): void {
  session.defaultSession.protocol.handle('https', async (request) => {
    const url = request.url
    if (url.includes('app.desert-chat.ru')) {
      try {
        const localPath = await siteCache.getLocalPath(url)
        if (localPath) {
          const data = await fs.readFile(localPath)
          const mimeType = getMimeType(localPath)
          return new Response(data, {
            headers: { 'content-type': mimeType }
          })
        }
      } catch (error) {
        console.error('Error serving from cache:', error)
      }
    }
    return fetch(request)
  })
}
