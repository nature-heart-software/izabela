import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import pkg from '@root/package.json'
import { Key, KeybindingResult } from '@/types/keybinds'
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
    display: null as null | Electron.Display['id'],
    keybindings: {
      recordAudio: [],
      toggleMessengerWindow: [
        {
          key: 'Control',
          code: 'ControlLeft',
          keyCode: 17,
          rawCode: 162,
          charCode: 0,
          which: 17,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
        {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          rawCode: 13,
          charCode: 0,
          which: 13,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
    } as Record<string, Key[]>,
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
