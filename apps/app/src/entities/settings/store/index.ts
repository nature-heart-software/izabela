import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

const storeState = {
  persisted: {
    playSpeechOnDefaultPlaybackDevice: true,
    audioOutputDevices: [] as MediaDeviceInfo['deviceId'][],
    audioInputDevice: 'default' as MediaDeviceInfo['deviceId'],
    selectedSpeechEngine: 'gctts' as SpeechEngine['id'],
    autoUpdateChannel: 'latest',
    launchOnStartup: true,
    GCTTSApiKey: '',
    GCTTSSelectedVoice: {
      languageCodes: ['en-GB'],
      ssmlGender: 'FEMALE',
      name: 'en-GB-Wavenet-A',
    },
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
