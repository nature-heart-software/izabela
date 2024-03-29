import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessengerStore = defineStore(
  'messenger',
  () => {
    const position = ref({
      transform: null,
      width: 0,
      height: 0,
      translate: [0, 0, 0, 1],
    })
    return {
      position,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)

export const useMessengerWindowStore = defineStore(
  'messenger-window',
  () => {
    const isShown = ref(false)
    const isFocused = ref(false)
    const isInputFocused = ref(false)
    const focusContext = ref<'mouse' | 'keyboard'>('mouse')
    return {
      isShown,
      isFocused,
      isInputFocused,
      focusContext,
    }
  },
  {
    electron: {
      shared: true,
    },
  },
)
