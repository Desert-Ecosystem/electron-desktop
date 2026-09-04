import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { showUpdateDialog } from './updateDialog'

let isUpdateDialogVisible = false
let notifiedVersion: string | null = null
let isChecking = false
let checkInterval: NodeJS.Timeout | null = null

async function showUpdateReadyDialog(
  mainWindow: BrowserWindow | null | undefined,
  version: string
): Promise<void> {
  if (isUpdateDialogVisible) return
  isUpdateDialogVisible = true
  try {
    const decision = await showUpdateDialog(mainWindow, version)
    if (decision === 'restart') autoUpdater.quitAndInstall()
    // При «later» / закрытии крестиком ничего не сбрасываем: notifiedVersion уже зафиксирован,
    // поэтому диалог по этой версии больше не покажется.
    // Обновление тихо встанет при выходе (autoInstallOnAppQuit).
  } finally {
    isUpdateDialogVisible = false
  }
}

export function setupUpdater(mainWindow?: BrowserWindow | null): void {
  if (!app.isPackaged) return
  if (checkInterval) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('error', (err) => console.error('Updater error:', err))
  autoUpdater.on('update-downloaded', (info) => {
    // electron-updater переизлучает событие при каждой проверке после скачивания —
    // показываем диалог только один раз на версию и только если нет открытого диалога.
    if (notifiedVersion === info.version) return
    notifiedVersion = info.version
    void showUpdateReadyDialog(mainWindow, info.version)
  })
  autoUpdater.checkForUpdatesAndNotify().catch((e) => console.error('Update check failed:', e))
  checkInterval = setInterval(() => {
    // Не спамим проверками/диалогами: обновление уже загружено или проверка в полете.
    if (notifiedVersion || isUpdateDialogVisible || isChecking) return
    isChecking = true
    autoUpdater
      .checkForUpdates()
      .catch(() => {})
      .finally(() => {
        isChecking = false
      })
  }, 60 * 1000)
  app.on('before-quit', () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  })
}
