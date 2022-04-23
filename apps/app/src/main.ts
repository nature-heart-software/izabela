import '@/plugins/debug'
import '@/styles'
import '@/teams/messenger/renderer'
import { createApp } from 'vue'
import { VueQueryPlugin } from "vue-query"

import App from './App.vue'
import router from './router'
import store from './store'

createApp(App)
  .use(store)
  .use(router)
  .use(VueQueryPlugin)
  .mount('#app')
