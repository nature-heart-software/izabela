import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOverlayWindowStore = defineStore(
  'overlay-window',
  () => {
    const isShown = ref(false)
    return {
      isShown,
    }
  },
  {
    electron: {
      shared: true,
    },
  },
)
