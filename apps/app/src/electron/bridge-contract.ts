import type electronDialog from '@/modules/electron-dialog'
import type electronFilesystem from '@/modules/electron-filesystem'
import type electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import type electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'
import type electronSpeechWorkerWindow from '@/teams/speech-worker/modules/electron-speech-worker-window'
import type electronKeybinding from '@/modules/electron-keybinding'
import type electronDisplay from '@/modules/electron-display'
import type electronResources from '@/modules/electron-resources'
import type electronSi from '@/modules/electron-si'
import type electronTranslation from '@/modules/electron-translation'

export interface AppBridgeModules {
  ElectronDialog: typeof electronDialog
  ElectronFilesystem: typeof electronFilesystem
  ElectronMessengerWindow: typeof electronMessengerWindow
  ElectronOverlayWindow: typeof electronOverlayWindow
  ElectronSpeechWorkerWindow: typeof electronSpeechWorkerWindow
  ElectronKeybinding: typeof electronKeybinding
  ElectronDisplay: typeof electronDisplay
  ElectronResources: typeof electronResources
  ElectronSI: typeof electronSi
  ElectronTranslation: typeof electronTranslation
}

export type BridgeMethods<Modules> = {
  [Name in keyof Modules]: {
    [Method in keyof Modules[Name] as Modules[Name][Method] extends (
      ...args: any[]
    ) => any
      ? Method
      : never]: true
  }
}

// Required function keys make additions/removals in main fail type checking here.
export const bridgeContract: BridgeMethods<AppBridgeModules> = {
  ElectronDialog: {
    showOpenDialog: true,
    showSaveDialog: true,
    showNotification: true,
  },
  ElectronFilesystem: {
    importGoogleCloudSpeechCredentials: true,
    getGoogleCloudSpeechCredentialsPath: true,
    downloadMessagePrompt: true,
    cacheAudio: true,
    getCachedAudio: true,
    deleteCachedAudio: true,
    clearCache: true,
  },
  ElectronMessengerWindow: {
    openDevTools: true,
    focus: true,
    blur: true,
    show: true,
    hide: true,
    toggleWindow: true,
    start: true,
    setDisplay: true,
    isReady: true,
    ensureNativeFocus: true,
    zoomIn: true,
    zoomOut: true,
    resetZoom: true,
    restart: true,
  },
  ElectronOverlayWindow: {
    show: true,
    hide: true,
    toggleWindow: true,
    start: true,
    setDisplay: true,
    isReady: true,
    zoomIn: true,
    zoomOut: true,
    resetZoom: true,
  },
  ElectronSpeechWorkerWindow: {
    start: true,
    transcribeAudio: true,
    restartNativeSpeechRecognition: true,
    setDisplay: true,
    show: true,
    hide: true,
  },
  ElectronKeybinding: {
    getKeyMap: true,
    getCurrentKeyboardLayout: true,
    isISOKeyboard: true,
    copyToClipboard: true,
    readFromClipboard: true,
  },
  ElectronDisplay: {
    getAllDisplays: true,
    getPrimaryDisplay: true,
  },
  ElectronResources: {
    isVirtualAudioCableInstalled: true,
    installVirtualAudioCable: true,
    uninstallVirtualAudioCable: true,
  },
  ElectronSI: { getInfo: true },
  ElectronTranslation: { translate: true },
}

declare global {
  interface Window extends AppBridgeModules {}
}
