import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import '@/styles'
import { computed, createApp, ref, watch } from 'vue'
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
import { useMainStore } from '@/store/pinia'

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

const mainStore = useMainStore()
watch(() => mainStore.doubleCount, () => {
  console.log('[messenger]', mainStore.doubleCount)
})
// setInterval(() => {
//   mainStore.increment()
// }, 5000)
