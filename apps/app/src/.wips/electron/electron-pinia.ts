// this works
// import path from 'path'
// const { spawn } = require('child_process');
// const child = spawn("node", [path.resolve('./playground/electron-pinia-poc.js')], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

// this works too
import electronPiniaPlugin from '@packages/electron-pinia'
import { createPinia, defineStore } from 'pinia'
import { createApp, h, watch, computed, effect, ref } from 'vue'

createApp(h({})).use(createPinia().use(electronPiniaPlugin));

const outsideRef = ref(0)
const useCounterStore = defineStore(
  'counter',
  () => {
    const count = ref(0)
    const name = ref('Eduardo')
    const doubleCount = computed(() => count.value * 2)
    function increment() {
      count.value += 1
    }
    return { count, name, doubleCount, increment }
  },
  {
    electron: {
      persisted: true,
    },
  } as any,
)
const counterStore = useCounterStore()

setInterval(() => {
  outsideRef.value += 1
  counterStore.increment()
}, 1000)

effect(() => {
  console.log('effect', counterStore.doubleCount)
})

watch(() => counterStore.doubleCount as any, () => {
  console.log(counterStore.count)
})

setInterval(() => {
  console.log(counterStore.count)
}, 5000)
