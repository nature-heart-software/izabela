import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameOverlayStore = defineStore(
  'game-overlay',
  () => {
    const allowlist = ref<string[]>([])
    const denylist = ref<string[]>([])
    const ignorelist = ref<string[]>([])

    return {
      enableGameOverlay: ref(false),
      allowlist,
      denylist,
      ignorelist,
      addToAllowlist(path: string) {
        allowlist.value.unshift(path)
      },
      removeFromAllowlist(index: number) {
        allowlist.value.splice(index, 1)
      },
      updateAllowlistItem(index: number, path: string) {
        allowlist.value[index] = path
      },
      addToDenylist(path: string) {
        denylist.value.unshift(path)
      },
      removeFromDenylist(index: number) {
        denylist.value.splice(index, 1)
      },
      updateDenylistItem(index: number, path: string) {
        denylist.value[index] = path
      },
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
