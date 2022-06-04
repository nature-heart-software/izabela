import '@/modules/electron-debug/renderer'
import '@/styles'
import { createApp } from 'vue'
import { VueQueryPlugin, VueQueryPluginOptions } from 'vue-query'

import App from '@/teams/messenger/App.vue'
import router from '@/router'
import store from '@/store'

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
}

createApp(App).use(store).use(router).use(VueQueryPlugin, vueQueryPluginOptions).mount('#app')
