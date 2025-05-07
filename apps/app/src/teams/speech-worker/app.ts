import { createApp } from 'vue'
import { pinia } from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'
import { loadStores } from '@/store/stores.ts'

const app = createApp(App)

app.use(pinia).use(VueQueryPlugin)

loadStores()
  .then(() => app.mount('#app'))

app.config.warnHandler = () => null
