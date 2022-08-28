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

let storage: ElectronStore

if (isMain) {
  storage = new ElectronStore({ name: ELECTRON_STORAGE_NAME })
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    return storage.get(name)
  })
  ipcMain.handle(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    storage.set(name, state)
    return true
  })
  ipcMain.handle(IPC_EVENT_STORE_DELETE, (_, { name }) => {
    storage.delete(name)
    return true
  })
}

export const persistStatePlugin: PiniaPlugin = ({ store }) => {
  const storage = getStorage()
  const loaded = isPreload ? Promise.resolve(true) : loadInitialState()

  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storage.set(getStorageName(store.$id), sanitizedState)
  }, 1000)

  async function getState() {
    return (await storage.get(getStorageName(store.$id))) || {}
  }

  function getStorage(): ElectronStore {
    return typeof isMain ? storage : window.ElectronPiniaStorage
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
