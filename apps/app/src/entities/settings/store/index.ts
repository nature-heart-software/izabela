import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import pkg from '@root/package.json'
import { KeybindingResult } from '@/types/keybinds'
import { ENGINE_ID } from '@/plugins/speech-engines/say/consts'

const { version } = pkg
// eslint-disable-next-line no-nested-ternary
const channel = version.includes('alpha')
  ? 'alpha'
  : // eslint-disable-next-line no-nested-ternary
  version.includes('beta')
  ? 'beta'
  : version.includes('rc')
  ? 'rc'
  : 'latest'
const storeState = {
  persisted: {
    playSpeechOnDefaultPlaybackDevice: true,
    audioOutputDevices: [] as MediaDeviceInfo['label'][],
    audioInputDevice: 'default' as MediaDeviceInfo['label'],
    selectedSpeechEngine: ENGINE_ID as SpeechEngine['id'],
    updateChannel: channel,
    launchOnStartup: true,
    debugMode: process.env.NODE_ENV === 'development',
    messageMode: 'sentence' as 'sentence' | 'word',
    recordAudioKeybinding: {
      keys: ['161'],
      modifiers: [],
      combination: [161],
    } as KeybindingResult,
    display: null as null | Electron.Display['id'],
    multiKeysKeybindings: {
      toggleMessengerWindow: null
    } as Record<string, KeybindingResult | null>
  },
}

export const settingsStore: Module<typeof storeState, any> = {
  namespaced: true,
  state: storeState,
  getters: {
    state: (state) => state,
    persisted: (state) => state.persisted,
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
}

export default settingsStore
