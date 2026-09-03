import { BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let pickerWindow: BrowserWindow | null = null
let displayMediaCallback:
  ((streams: { video?: Electron.DesktopCapturerSource; audio?: 'loopback' }) => void) | null = null

export function createPickerWindow(mainWindow: BrowserWindow | null): void {
  if (pickerWindow) {
    pickerWindow.focus()
    return
  }

  pickerWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    resizable: false,
    parent: mainWindow || undefined,
    modal: mainWindow ? true : false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  pickerWindow.on('ready-to-show', () => {
    pickerWindow?.show()
  })

  pickerWindow.on('closed', () => {
    pickerWindow = null
    if (displayMediaCallback) {
      const callback = displayMediaCallback
      displayMediaCallback = null
      callback({ video: undefined })
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    pickerWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/picker.html`)
  } else {
    pickerWindow.loadFile(join(__dirname, '../renderer/picker.html'))
  }
}

export function setupPickerHandlers(): void {
  ipcMain.handle('get-sources', async () => {
    let hasAccess = true
    if (process.platform === 'darwin') {
      const { systemPreferences } = await import('electron')
      const accessStatus = systemPreferences.getMediaAccessStatus('screen')
      hasAccess = accessStatus === 'granted'
      if (!hasAccess) {
        console.warn('Screen Recording permission not granted!')
        return { error: 'no-permission', hasAccess: false }
      }
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 300, height: 200 },
      fetchWindowIcons: false
    })

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnailDataUrl: source.thumbnail.toDataURL(),
      appIcon: null
    }))
  })

  ipcMain.handle('select-source', async (_, sourceId: string, includeAudio: boolean) => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window']
    })
    const selectedSource = sources.find((source) => source.id === sourceId)

    if (displayMediaCallback && selectedSource) {
      const callback = displayMediaCallback
      displayMediaCallback = null
      const isScreen = sourceId.startsWith('screen:')
      callback({
        video: selectedSource,
        ...(includeAudio && isScreen ? { audio: 'loopback' as const } : {})
      })
    }

    if (pickerWindow) {
      pickerWindow.close()
    }

    return { sourceId, includeAudio }
  })

  ipcMain.handle('cancel-picker', async () => {
    if (displayMediaCallback) {
      const callback = displayMediaCallback
      displayMediaCallback = null
      callback({ video: undefined })
    }
    if (pickerWindow) {
      pickerWindow.close()
    }
  })
}

export function setDisplayMediaCallback(
  callback: (streams: { video?: Electron.DesktopCapturerSource; audio?: 'loopback' }) => void
): void {
  displayMediaCallback = callback
}

export function getPickerWindow(): BrowserWindow | null {
  return pickerWindow
}
