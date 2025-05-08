import { createApp } from 'vue'
import { pinia } from '@/store'
import { VueQueryPlugin } from 'vue-query'
import App from './App.vue'
import { loadStores } from '@/store/stores.ts'

const app = createApp(App)

app.use(pinia).use(VueQueryPlugin)

loadStores().then(() => app.mount('#app'))

app.config.warnHandler = () => null
