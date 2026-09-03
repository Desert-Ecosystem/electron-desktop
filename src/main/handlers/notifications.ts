import { ipcMain, Notification } from 'electron'

export function setupNotificationsHandler(): void {
  ipcMain.handle(
    'show-notification',
    (_event, { title, body }: { title: string; body: string }) => {
      try {
        new Notification({ title, body }).show()
      } catch (error) {
        console.error('Failed to show notification:', error)
      }
    }
  )
}
