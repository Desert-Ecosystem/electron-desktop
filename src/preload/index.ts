import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSources: (): Promise<unknown> => ipcRenderer.invoke('get-sources'),
  selectSource: (sourceId: string, includeAudio: boolean): Promise<unknown> =>
    ipcRenderer.invoke('select-source', sourceId, includeAudio),
  cancelPicker: (): Promise<void> => ipcRenderer.invoke('cancel-picker'),
  getUpdateInfo: (): Promise<{ version: string }> => ipcRenderer.invoke('get-update-info'),
  confirmUpdateRestart: (): Promise<void> => ipcRenderer.invoke('update-restart'),
  dismissUpdate: (): Promise<void> => ipcRenderer.invoke('update-later'),
  debugShowUpdate: (version?: string): Promise<string> =>
    ipcRenderer.invoke('debug-show-update', version),
  system: {
    showNotification: (title: string, body: string): Promise<void> =>
      ipcRenderer.invoke('show-notification', { title, body }),
    onPTTon: (callback: () => void): (() => void) => {
      ipcRenderer.on('ptt-on', callback)
      return (): void => {
        ipcRenderer.removeListener('ptt-on', callback)
      }
    },
    onPTToff: (callback: () => void): (() => void) => {
      ipcRenderer.on('ptt-off', callback)
      return (): void => {
        ipcRenderer.removeListener('ptt-off', callback)
      }
    }
  },
  user: {
    enablePTTwithKey: (keyId: number): void => {
      window.localStorage.setItem('pttKeyIfEnabled', keyId.toString())
    },
    disablePTT: (): void => {
      window.localStorage.removeItem('pttKeyIfEnabled')
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore: expose fallback
  window.electron = electronAPI
  // @ts-ignore: expose fallback
  window.api = api
}
