import '@/electron/renderer'
import '@/modules/electron-debug/renderer'
import { createApp, watch } from 'vue'
import store from '@/store'
import App from '@/teams/speech-worker/App.vue'
import { VueQueryPlugin } from 'vue-query'
import '@/plugins'
import { useMainStore } from '@/store/pinia'
import { createPinia } from 'pinia'
// eslint-disable-next-line
// @ts-ignore
import electronPiniaPlugin from '@packages/electron-pinia/renderer'

createApp(App).use(store).use(VueQueryPlugin)
  .use(createPinia().use(electronPiniaPlugin)).mount('#app')

const mainStore = useMainStore()
watch(() => mainStore.doubleCount, () => {
  console.log('[speech-worker]', mainStore.doubleCount)
})
