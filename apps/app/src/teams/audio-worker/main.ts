import { createApp } from 'vue'
import App from '@/teams/audio-worker/App.vue'
import store from '@/store'

console.log('hello worker')

createApp(App).use(store).mount('#app')
