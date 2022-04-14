import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'

const storeState = {
  persisted: {
    playSpeechOnDefaultPlaybackDevice: true,
    audioOutputDevices: [] as MediaDeviceInfo['deviceId'][],
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
