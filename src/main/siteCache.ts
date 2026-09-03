import { app } from 'electron'
import { join, dirname } from 'path'
import { promises as fs } from 'fs'
import https from 'https'
import http from 'http'
import { createHash } from 'crypto'

const SITE_URL = 'https://app.desert-chat.ru'
const MANIFEST_URL = `${SITE_URL}/api/desktop-manifest`
const CACHE_DIR_NAME = 'site-cache'

interface ManifestFile {
  url: string
  hash: string
  size: number
}

interface Manifest {
  version: string
  generatedAt: string
  files: ManifestFile[]
}

export class SiteCache {
  private cacheDir: string
  private isReady = false
  private manifest: Manifest | null = null

  constructor() {
    this.cacheDir = join(app.getPath('userData'), CACHE_DIR_NAME)
  }

  async initialize(
    onProgress?: (done: number, total: number, currentUrl: string) => void
  ): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true })

    let remoteManifest: Manifest | null = null
    try {
      onProgress?.(0, 1, 'Проверка обновлений...')
      remoteManifest = await this.fetchManifest()
      console.log(
        `Manifest fetched: version=${remoteManifest.version} files=${remoteManifest.files.length}`
      )
    } catch (error) {
      console.error('Failed to fetch manifest:', error)
      const local = await this.loadLocalManifest()
      if (local) {
        console.log(`Using local cache version=${local.version} (offline)`)
        this.manifest = local
        this.isReady = true
        onProgress?.(1, 1, 'Оффлайн режим')
        return
      }
      throw error
    }

    const localManifest = await this.loadLocalManifest()
    const needsUpdate = !localManifest || localManifest.version !== remoteManifest.version

    if (!needsUpdate) {
      const allExist = await this.verifyAllFilesExist(remoteManifest)
      if (allExist) {
        console.log('Cache up to date:', remoteManifest.version)
        this.manifest = remoteManifest
        this.isReady = true
        onProgress?.(1, 1, 'Кеш актуален')
        return
      }
    }

    const localMap = new Map<string, string>()
    if (localManifest) {
      for (const f of localManifest.files) localMap.set(f.url, f.hash)
    }

    const toDownload: ManifestFile[] = []
    for (const file of remoteManifest.files) {
      const localHash = localMap.get(file.url)
      if (localHash === file.hash) {
        const exists = await this.fileExists(this.urlToFilePath(file.url))
        if (exists) continue
      }
      toDownload.push(file)
    }

    console.log(
      `Cache update: ${toDownload.length}/${remoteManifest.files.length} files to download`
    )

    if (toDownload.length === 0) {
      onProgress?.(1, 1, 'Кеш актуален')
    } else {
      let done = 0
      const total = toDownload.length
      onProgress?.(0, total, '')
      const concurrency = 6
      for (let i = 0; i < toDownload.length; i += concurrency) {
        const chunk = toDownload.slice(i, i + concurrency)
        const results = await Promise.allSettled(chunk.map((f) => this.downloadFile(f)))
        for (let j = 0; j < results.length; j++) {
          done++
          const r = results[j]
          if (r.status === 'rejected') {
            console.error(`Failed to download ${chunk[j].url}:`, r.reason)
          }
          onProgress?.(done, total, '')
        }
      }
    }

    if (localManifest) {
      const remoteUrls = new Set(remoteManifest.files.map((f) => f.url))
      for (const file of localManifest.files) {
        if (!remoteUrls.has(file.url)) {
          const p = this.urlToFilePath(file.url)
          await fs.rm(p, { force: true }).catch(() => {})
          console.log('Removed obsolete:', file.url)
        }
      }
    }

    await fs.writeFile(
      join(this.cacheDir, 'manifest.json'),
      JSON.stringify(remoteManifest, null, 2)
    )
    this.manifest = remoteManifest
    this.isReady = true
    console.log('Site cache ready at:', this.cacheDir, 'version:', remoteManifest.version)
  }

  private async fetchManifest(): Promise<Manifest> {
    const res = await fetch(MANIFEST_URL, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Manifest HTTP ${res.status}`)
    const data = (await res.json()) as Manifest
    if (!data.version || !Array.isArray(data.files)) throw new Error('Invalid manifest')
    return data
  }

  private async loadLocalManifest(): Promise<Manifest | null> {
    try {
      const raw = await fs.readFile(join(this.cacheDir, 'manifest.json'), 'utf-8')
      return JSON.parse(raw) as Manifest
    } catch {
      return null
    }
  }

  private async verifyAllFilesExist(manifest: Manifest): Promise<boolean> {
    for (const file of manifest.files) {
      if (!(await this.fileExists(this.urlToFilePath(file.url)))) return false
    }
    return true
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  private urlToFilePath(url: string): string {
    if (url === '/' || url === '') return join(this.cacheDir, 'index.html')
    const pathname = url.split('?')[0].split('#')[0]
    return join(this.cacheDir, pathname.replace(/^\/+/, ''))
  }

  private async downloadFile(entry: ManifestFile): Promise<void> {
    const url = entry.url === '/' ? `${SITE_URL}/` : `${SITE_URL}${entry.url}`
    const filePath = this.urlToFilePath(entry.url)
    const data = await this.fetchUrl(url)
    const hash = `sha256:${createHash('sha256').update(data).digest('hex')}`
    if (hash !== entry.hash) {
      console.warn(`Hash mismatch for ${entry.url}: expected ${entry.hash} got ${hash}`)
    }
    await fs.mkdir(dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, data)
    console.log(`Downloaded ${entry.url} -> ${filePath}`)
  }

  private fetchUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http
      client
        .get(url, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            if (res.headers.location) {
              const next = res.headers.location.startsWith('/')
                ? `${SITE_URL}${res.headers.location}`
                : res.headers.location
              this.fetchUrl(next).then(resolve).catch(reject)
              return
            }
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`))
            return
          }
          const chunks: Buffer[] = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => resolve(Buffer.concat(chunks)))
          res.on('error', reject)
        })
        .on('error', reject)
    })
  }

  async getLocalPath(requestUrl: string): Promise<string | null> {
    if (!this.isReady) return null
    try {
      const url = new URL(requestUrl)
      if (url.hostname !== 'app.desert-chat.ru') return null
      const pathname = url.pathname
      const fileUrl = pathname === '/' || pathname === '' ? '/' : pathname
      if (this.manifest && !this.manifest.files.some((f) => f.url === fileUrl)) {
        return null
      }
      const filePath = this.urlToFilePath(fileUrl)
      await fs.access(filePath)
      return filePath
    } catch {
      return null
    }
  }

  getCacheDir(): string {
    return this.cacheDir
  }

  getManifest(): Manifest | null {
    return this.manifest
  }

  isInitialized(): boolean {
    return this.isReady
  }
}
