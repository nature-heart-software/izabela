import { createApp } from 'vue'
import { pinia } from '@/store'
import { VueQueryPlugin } from 'vue-query'
import App from './App.vue'

const app = createApp(App)

app.use(pinia).use(VueQueryPlugin)

app.mount('#app')

app.config.warnHandler = () => null
