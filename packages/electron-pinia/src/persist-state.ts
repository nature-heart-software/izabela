import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import debounce from 'lodash/debounce'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import ElectronStore from 'electron-store'
import { computed } from 'vue'
import { ipcMain } from 'electron'
import {
  ELECTRON_STORAGE_NAME,
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
  isMain,
  isPreload,
} from '@/consts'

if (isMain) {
  const store = new ElectronStore({ name: ELECTRON_STORAGE_NAME })
  ipcMain.on(IPC_EVENT_STORE_GET, (event, [{ name }]) => {
    event.reply(store.get(name))
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (_, [{ name, state }]) => {
    store.set(name, state)
  })
  ipcMain.on(IPC_EVENT_STORE_DELETE, (_, [{ name }]) => {
    store.delete(name)
  })
}

export const persistState: PiniaPlugin = ({ store }) => {
  const storage = createStorage()
  const loaded = isPreload ? Promise.resolve(true) : loadInitialState()

  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storage.set(getStorageName(store.$id), sanitizedState)
  }, 1000)

  async function getState() {
    return (await storage.get(getStorageName(store.$id))) || {}
  }

  function createStorage(): ElectronStore {
    return typeof window !== 'undefined'
      ? window.ElectronPiniaStore
      : new ElectronStore({ name: ELECTRON_STORAGE_NAME })
  }

  function getStorageName(storeId: PiniaPluginContext['store']['$id']) {
    return `electron-pinia-${storeId}`
  }

  function purify(o?: object | [] | null) {
    if (typeof o === 'object') {
      return JSON.parse(JSON.stringify(o))
    }
    return o
  }

  async function loadInitialState() {
    const state = await getState()

    if (state) {
      const mergedState = defaultsDeep(
        cloneDeep(state),
        cloneDeep(store.$state),
      )
      store.$patch(mergedState)
    }
    return true
  }

  store.$subscribe((_, state) => setState(state))
  return {
    isReady: computed(() => () => loaded),
  }
}
