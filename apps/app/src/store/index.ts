import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'

export default createStore({
  state: {
    hello: 'world',
  },
  getters: {},
  mutations: {
    setHello(state, value) {
      state.hello = value
    },
  },
  actions: {
    setHello({ commit }, value) {
      commit('setHello', value)
    },
  },
  modules: {
    messenger,
  },
  plugins: [createPersistedState({
    whitelist: (mutation: MutationPayload) => mutation.type.includes('setPersisted'),
  }), createSharedMutations()],
})
