import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { SPEECH_ENGINES } from '@/entities/speech'

const storeState = {
  persisted: {
    playSpeechOnDefaultPlaybackDevice: true,
    audioOutputDevices: [] as MediaDeviceInfo['deviceId'][],
    selectedSpeechEngine: 'gctts' as typeof SPEECH_ENGINES[number]['id'],
    googleCloudApiKey: '',
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
