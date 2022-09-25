import { createApp } from 'vue'
import { pinia } from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'

const app = createApp(App)

app.use(pinia).use(VueQueryPlugin)

app.mount('#app')
