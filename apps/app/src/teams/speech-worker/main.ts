import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import { createApp } from 'vue'
import store from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'
import { pinia } from '@/store/pinia'

const app = createApp(App)

app.use(store).use(pinia).use(VueQueryPlugin)

app.mount('#app')

require('@/plugins')
