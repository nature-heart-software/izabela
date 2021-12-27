import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'

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

export default messengerStore
