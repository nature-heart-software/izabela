import { createApp } from 'vue'
import { pinia } from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'
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
