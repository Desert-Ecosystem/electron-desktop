import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createPickerWindow, setupPickerHandlers, setDisplayMediaCallback } from './picker'
import { SiteCache } from './siteCache'
import { setupRequestInterceptor } from './requestInterceptor'
import { createSplashWindow, updateSplashProgress, closeSplashWindow } from './splash'
import { setupNotificationsHandler } from './handlers/notifications'
import { setupUpdateDialogHandlers } from './updateDialog'
import { setupUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
const siteCache = new SiteCache()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    backgroundColor: '#000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:"
        ]
      }
    })
  })

  mainWindow.loadURL('https://app.desert-chat.ru')
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.desert.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  setupNotificationsHandler()
  setupPickerHandlers()
  setupUpdateDialogHandlers()

  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    setDisplayMediaCallback(callback)
    createPickerWindow(mainWindow)
  })

  createSplashWindow()

  try {
    await siteCache.initialize((done, total, label) => {
      const percent = total > 0 ? Math.round((done / total) * 100) : 0
      updateSplashProgress(percent, label)
    })
    setupRequestInterceptor(siteCache)
    updateSplashProgress(100, 'Готово')
    console.log('Site cache and request interceptor ready')
  } catch (error) {
    console.error('Failed to setup site cache:', error)
    updateSplashProgress(100, 'Ошибка загрузки')
  }

  await new Promise((resolve) => setTimeout(resolve, 5000))

  closeSplashWindow()
  createWindow()
  setupUpdater(mainWindow)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
