import { decrypt, encrypt } from '@/utils/security'
import { createPinia, defineStore } from 'pinia'
import { ref } from 'vue'
import { electronPiniaPlugin } from '@packages/electron-pinia/dist/renderer.es.js'

export const pinia = createPinia().use(electronPiniaPlugin())

export const registerPluginStore = <S extends Record<any, any>>(id: string, state: S) => {
  const usePluginStore = defineStore(
    `plugin-${id}`,
    () => {
      const pluginState = ref<Record<any, any>>(state)
      return {
        pluginState,
      }
    },
    { electron: { shared: true, persisted: true } },
  )
  const pluginStore = usePluginStore()
  return {
    setProperty(property: keyof S, value: any, encryptValue = false) {
      const fn = encryptValue ? encrypt : (v: any) => v
      pluginStore.$patch({ pluginState: { [property]: fn(value) } })
    },
    getProperty(property: keyof S, decryptValue = false) {
      const fn = decryptValue ? decrypt : (v: any) => v
      return fn(pluginStore.$state.pluginState[property])
    },
  }
}
