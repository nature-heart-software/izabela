import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import '@/styles'
import { computed, createApp, ref } from 'vue'
import { VueQueryPlugin, VueQueryPluginOptions } from 'vue-query'

import App from '@/teams/messenger/App.vue'
import router from '@/teams/messenger/router'
import store from '@/store'
import '@/plugins'
import { NvLoading } from '@packages/ui'

import { watchBoundary } from '@/modules/vue-dom-boundaries'
import { createPinia, defineStore } from 'pinia'
// eslint-disable-next-line
// @ts-ignore
import electronPiniaPlugin from '@packages/electron-pinia/renderer'

watchBoundary('.el-select-dropdown')
watchBoundary('.tippy-box')

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
}

const app = createApp(App)
  .use(store)
  .use(router)
  .use(VueQueryPlugin, vueQueryPluginOptions)
  .use(NvLoading)
  .use(createPinia().use(electronPiniaPlugin))
app.mount('#app')

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
  console.log('renderer', counterStore.doubleCount)
}, 1000)
