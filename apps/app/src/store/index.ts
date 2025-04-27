import { decrypt, encrypt } from '@/utils/security'
import { createPinia, defineStore } from 'pinia'
import { createApp, h, ref } from 'vue'
import { electronPiniaPlugin } from '@packages/electron-pinia'

export { storesStates } from '@packages/electron-pinia'

export const pinia = createPinia().use(electronPiniaPlugin())
/* ensures pinia is always available */
createApp(h({})).use(pinia)

export const definePluginStore = <S extends Record<any, any>>(
  id: string,
  state: S,
) => {
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
  return {
    getId() {
      const pluginStore = usePluginStore()
      return pluginStore.$id
    },
    setProperty(property: keyof S, value: any, encryptValue = false) {
      const pluginStore = usePluginStore()
      const fn = encryptValue ? encrypt : (v: any) => v
      pluginStore.$patch({ pluginState: { [property]: fn(value) } })
    },
    getProperty(property: keyof S, decryptValue = false) {
      const pluginStore = usePluginStore()
      const fn = decryptValue ? decrypt : (v: any) => v
      return fn(pluginStore.$state.pluginState[property])
    },
  }
}
