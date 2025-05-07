import { decrypt, encrypt } from '@/utils/security'
import { createPinia, defineStore } from 'pinia'
import { createApp, h, ref } from 'vue'
import { electronPiniaPlugin } from '@packages/electron-pinia'
import pick from 'lodash/pick'

export { storesStates } from '@packages/electron-pinia'

export const pinia = createPinia().use(electronPiniaPlugin())
/* ensures pinia is always available */
createApp(h({})).use(pinia)

export const definePluginStore = <S extends Record<any, any>>(
  id: string,
  state: S,
  exposedProperties: (keyof S)[] = Object.keys(state),
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

  const getEncryptFunction = (encryptValue = false) =>
    encryptValue ? encrypt : (v: any) => v
  const getDecryptFunction = (decryptValue = false) =>
    decryptValue ? decrypt : (v: any) => v

  function getProperty(property: keyof S, decryptValue = false) {
    const pluginStore = usePluginStore()
    const fn = getDecryptFunction(decryptValue)
    return fn(pluginStore.$state.pluginState[property])
  }

  function setProperty(property: keyof S, value: any, encryptValue = false) {
    const pluginStore = usePluginStore()
    const fn = getEncryptFunction(encryptValue)
    pluginStore.$patch({ pluginState: { [property]: fn(value) } })
  }

  function getPropertyPath(property: keyof S) {
    const pluginStore = usePluginStore()
    return [pluginStore.$id, 'pluginState', property].join('.')
  }

  return {
    getId() {
      const pluginStore = usePluginStore()
      return pluginStore.$id
    },
    setProperty,
    getProperty,
    getPropertyPath,
    useStoreOrForm(form?: any) {
      if (form)
        return {
          getProperty(...args: Parameters<typeof getProperty>) {
            const fn = getDecryptFunction(args[1])
            return fn(form[getPropertyPath(args[0])])
          },
          setProperty(...args: Parameters<typeof setProperty>) {
            const fn = getEncryptFunction(args[2])
            form[getPropertyPath(args[0])] = fn(args[1])
          },
          getStoreProperty: getProperty,
          setStoreProperty: setProperty,
        }
      return {
        getProperty,
        setProperty,
        getStoreProperty: getProperty,
        setStoreProperty: setProperty,
      }
    },
    exposedProperties,
    getExposedProperties() {
      const pluginStore = usePluginStore()
      return pick(pluginStore.$state.pluginState, exposedProperties)
    },
    getState() {
      return usePluginStore()
    },
  }
}
