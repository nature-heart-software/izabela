import { createApp } from 'vue'
import { VueQueryPlugin, VueQueryPluginOptions } from 'vue-query'

import App from '@/teams/messenger/App.vue'
import router from '@/teams/messenger/router'
import { pinia } from '@/store'
import { NvLoading } from '@packages/ui'

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
  .use(router)
  .use(pinia)
  .use(VueQueryPlugin, vueQueryPluginOptions)
  .use(NvLoading)

app.mount('#app')
