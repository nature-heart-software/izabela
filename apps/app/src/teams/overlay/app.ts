import { createApp } from 'vue'
import { pinia } from '@/store'
import { VueQueryPlugin } from 'vue-query'
import App from './App.vue'
import { loadStores } from '@/store/stores.ts'
import {
  sessionErrorReporting,
  sessionQueryOptions,
} from '@/features/session-errors/plugin'

const app = createApp(App)

app
  .use(pinia)
  .use(sessionErrorReporting)
  .use(VueQueryPlugin, sessionQueryOptions())

loadStores().then(() => app.mount('#app'))

app.config.warnHandler = () => null
