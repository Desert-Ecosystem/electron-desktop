import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

export type UpdateDecision = 'restart' | 'later'

let updateWindow: BrowserWindow | null = null
let pendingPromise: Promise<UpdateDecision> | null = null
let pendingResolve: ((decision: UpdateDecision) => void) | null = null
let currentVersion = ''
let handlersRegistered = false

function closeAndResolve(decision: UpdateDecision): void {
  if (pendingResolve) {
    const resolve = pendingResolve
    pendingResolve = null
    resolve(decision)
  }
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close()
  }
  updateWindow = null
}

export function setupUpdateDialogHandlers(): void {
  if (handlersRegistered) return
  handlersRegistered = true

  ipcMain.handle('get-update-info', () => ({ version: currentVersion }))
  ipcMain.handle('update-restart', () => {
    closeAndResolve('restart')
  })
  ipcMain.handle('update-later', () => {
    closeAndResolve('later')
  })
  // Тестовый вызов из консоли главного окна:
  // await window.api.debugShowUpdate('9.9.9-test')
  ipcMain.handle('debug-show-update', (event, version?: string) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender) ?? null
    const v = typeof version === 'string' && version.trim() ? version.trim() : '9.9.9-test'
    return showUpdateDialog(senderWindow, v)
  })
}

export function isUpdateWindowOpen(): boolean {
  return updateWindow !== null && !updateWindow.isDestroyed()
}

export function showUpdateDialog(
  mainWindow: BrowserWindow | null | undefined,
  version: string
): Promise<UpdateDecision> {
  currentVersion = version

  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus()
    return pendingPromise ?? Promise.resolve<UpdateDecision>('later')
  }

  updateWindow = new BrowserWindow({
    width: 440,
    height: 300,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow || undefined,
    modal: mainWindow ? true : false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const decisionPromise = new Promise<UpdateDecision>((resolve) => {
    pendingResolve = resolve
  })
  pendingPromise = decisionPromise
  decisionPromise.finally(() => {
    if (pendingPromise === decisionPromise) pendingPromise = null
  })

  updateWindow.on('ready-to-show', () => {
    updateWindow?.show()
  })

  updateWindow.on('closed', () => {
    updateWindow = null
    // Закрытие крестиком = «Позже», без повторного спама (см. notifiedVersion в updater).
    if (pendingResolve) {
      const resolve = pendingResolve
      pendingResolve = null
      resolve('later')
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    updateWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/update.html`)
  } else {
    updateWindow.loadFile(join(__dirname, '../renderer/update.html'))
  }

  return decisionPromise
}
