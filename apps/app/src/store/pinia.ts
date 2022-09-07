import { createPinia, PiniaPlugin } from 'pinia'
import { electronPiniaPlugin } from '@packages/electron-pinia/dist/renderer.es.js'

export const pinia = createPinia()
  .use(electronPiniaPlugin())
