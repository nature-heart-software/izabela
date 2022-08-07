import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import { createApp } from 'vue'
import store from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'
import '@/plugins'

createApp(App).use(store).use(VueQueryPlugin).mount('#app')
