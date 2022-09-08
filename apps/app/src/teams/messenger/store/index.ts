import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const storeState = {
  isShown: false,
  isFocused: false,
  isInputFocused: false,
  persisted: {
    position: {
      transform: 'matrix(1, 0, 0, 1, 0, 0) translate(0px, 0px)',
      width: 0,
      height: 0,
      translate: [0, 0, 0, 1],
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

export const useMessengerStore = defineStore('messenger', () => {
  const isShown = ref(false)
  const isFocused = ref(false)
  const isInputFocused = ref(false)
  const position = ref({
    transform: 'matrix(1, 0, 0, 1, 0, 0) translate(0px, 0px)',
    width: 0,
    height: 0,
    translate: [0, 0, 0, 1],
  })
  return {
    isShown,
    isFocused,
    isInputFocused,
    position,
  }
}, {
  electron: {
    persisted: true,
    shared: true,
  },
})
