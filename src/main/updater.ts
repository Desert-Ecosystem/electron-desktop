import { app, BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

export function setupUpdater(mainWindow?: BrowserWindow | null): void {
  if (!app.isPackaged) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('error', (err) => console.error('Updater error:', err))
  autoUpdater.on('update-downloaded', () => {
    const options = {
      type: 'info' as const,
      title: 'Обновление готово',
      message: 'Новая версия Desert загружена. Перезапустить сейчас?',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0
    }
    const promise =
      mainWindow && !mainWindow.isDestroyed()
        ? dialog.showMessageBox(mainWindow, options)
        : dialog.showMessageBox(options)
    promise.then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall()
    })
  })
  autoUpdater.checkForUpdatesAndNotify().catch((e) => console.error('Update check failed:', e))
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 60 * 1000)
}
