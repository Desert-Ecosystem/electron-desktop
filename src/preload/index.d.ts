import { ElectronAPI } from '@electron-toolkit/preload'

interface PickerSource {
  id: string
  name: string
  thumbnailDataUrl: string
  appIcon: null
}

interface PickerAPI {
  getSources: () => Promise<PickerSource[] | { error: string; hasAccess: boolean }>
  selectSource: (sourceId: string, includeAudio: boolean) => Promise<{ sourceId: string; includeAudio: boolean }>
  cancelPicker: () => Promise<void>
  getUpdateInfo: () => Promise<{ version: string }>
  confirmUpdateRestart: () => Promise<void>
  dismissUpdate: () => Promise<void>
  debugShowUpdate: (version?: string) => Promise<string>
  system: {
    showNotification: (title: string, body: string) => Promise<void>
    onPTTon: (callback: () => void) => () => void
    onPTToff: (callback: () => void) => () => void
  }
  user: {
    enablePTTwithKey: (keyId: number) => void
    disablePTT: () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PickerAPI
  }
}
