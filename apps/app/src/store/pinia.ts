import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  return {
    count,
    doubleCount,
    increment() {
      count.value += 1
    }
  }
}, {
  electron: {
    persisted: true,
    shared: true
  }
} as any)
