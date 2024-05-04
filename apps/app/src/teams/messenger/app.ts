import { createApp } from 'vue'
import { VueQueryPlugin, VueQueryPluginOptions } from 'vue-query'

import App from '@/teams/messenger/App.vue'
import router from '@/teams/messenger/router'
import { pinia } from '@/store'
import { NvLoading } from '@packages/ui'
import VueJsTour from '@globalhive/vuejs-tour'
import '@globalhive/vuejs-tour/dist/style.css'
import './styles'

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
  .use(VueJsTour)

app.mount('#app')

app.config.warnHandler = () => null
