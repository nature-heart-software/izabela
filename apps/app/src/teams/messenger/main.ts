import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import '@/styles'
import { createApp } from 'vue'
import { VueQueryPlugin, VueQueryPluginOptions } from 'vue-query'

import App from '@/teams/messenger/App.vue'
import router from '@/teams/messenger/router'
import store from '@/store'
import '@/plugins'
import { NvLoading } from '@packages/ui'

import { watchBoundary } from '@/modules/vue-dom-boundaries'
import { pinia } from '@/store/pinia'

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
  .use(pinia)
  .use(VueQueryPlugin, vueQueryPluginOptions)
  .use(NvLoading)

app.mount('#app')
