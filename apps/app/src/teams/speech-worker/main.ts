import '@/plugins/electron-debug/renderer'
import { createApp } from 'vue'
import store from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'

createApp(App).use(store).use(VueQueryPlugin).mount('#app')
