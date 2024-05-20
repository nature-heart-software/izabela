import { bridge } from '@packages/electron-bridger'
import electronDialog from '@/modules/electron-dialog'
import electronFilesystem from '@/modules/electron-filesystem'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import electronSpeechWorkerWindow from '@/teams/speech-worker/modules/electron-speech-worker-window'
import electronKeybinding from '@/modules/electron-keybinding'
import electronDisplay from '@/modules/electron-display'
import electronResources from '@/modules/electron-resources'
import electronSi from '@/modules/electron-si'
import electronTranslation from '@/modules/electron-translation'
import electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'

export const bridgeModules = () =>
    bridge.register([
        ['ElectronDialog', () => electronDialog],
        ['ElectronFilesystem', () => electronFilesystem],
        ['ElectronMessengerWindow', () => electronMessengerWindow],
        ['ElectronOverlayWindow', () => electronOverlayWindow],
        ['ElectronSpeechWorkerWindow', () => electronSpeechWorkerWindow],
        ['ElectronKeybinding', () => electronKeybinding],
        ['ElectronDisplay', () => electronDisplay],
        ['ElectronResources', () => electronResources],
        ['ElectronSI', () => electronSi],
        ['ElectronTranslation', () => electronTranslation],
    ])

declare global {
    interface Window {
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
}
