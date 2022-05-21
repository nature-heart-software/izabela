import '@/plugins/electron-debug/renderer'
import { createApp } from 'vue'
import store from '@/store'
import App from '@/teams/speech-worker/App.vue'

createApp(App).use(store).mount('#app')
