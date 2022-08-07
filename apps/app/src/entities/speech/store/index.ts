import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { getEngineById } from '@/modules/speech-engine-manager'

const storeState = {
  persisted: {},
}

const store: Module<typeof storeState, any> = {
  namespaced: true,
  state: storeState,
  getters: {
    state: (state) => state,
    persisted: (state) => state.persisted,
    currentSpeechEngine: (state, getters, rootState, rootGetters) =>
      getEngineById(rootGetters['speech/selectedSpeechEngine']),
    selectedSpeechEngine: (state, getters, rootState, rootGetters) => {
      const engine = getEngineById(rootGetters['settings/persisted'].selectedSpeechEngine)
      if (engine && engine.hasCredentials && engine.hasCredentials()) {
        return rootGetters['settings/persisted'].selectedSpeechEngine
      }
      return 'saytts'
    },
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
}

export default store
