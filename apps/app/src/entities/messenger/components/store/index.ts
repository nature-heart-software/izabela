import { Module } from 'vuex'

const storeState = {
  persisted: {
    position: {
      transform: 'matrix(1, 0, 0, 1, 0, 0) translate(0px, 0px)',
      width: 768,
      height: 200,
    },
  },
}

export const messengerStore: Module<typeof storeState, any> = {
  namespaced: true,
  state: storeState,
  getters: {
    persisted: (state) => state.persisted,
  },
  mutations: {
    setPersisted(state, value: typeof storeState['persisted']) {
      state.persisted = value
    },
  },
  actions: {
    setPersisted({ commit }, value: typeof storeState['persisted']) {
      commit('setPersisted', value)
    },
  },
}

export default messengerStore
