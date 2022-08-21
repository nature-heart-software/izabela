import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
// eslint-disable-next-line import/no-cycle
import { getEngineById } from '@/modules/speech-engine-manager'
import { ENGINE_ID } from '@/plugins/speech-engines/say/consts'

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
      return ENGINE_ID
    },
    commands: (state, getters, rootState, rootGetters) => {
      const engine = getEngineById(rootGetters['settings/persisted'].selectedSpeechEngine)
      if (engine && engine.commands) {
        const voice = engine.store.getProperty('selectedVoice')
        return engine.commands(voice)
      }
      return []
    }
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
}

export default store
