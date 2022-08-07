import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { getEngineById } from '@/entities/speech/modules/speech-engine-manager'

const storeState = {
  persisted: {},
}

const store: Module<typeof storeState, any> = {
  namespaced: true,
  state: storeState,
  getters: {
    state: (state) => state,
    persisted: (state) => state.persisted,
    currentSpeechEngine: (state, getters, rootState, rootGetters) => getEngineById(rootGetters['settings/selectedSpeechEngine']),
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
}

export default store
