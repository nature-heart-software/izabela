import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import debounce from 'lodash/debounce'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'
import { computed } from 'vue'
import {
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
  isMain,
  isPreload,
} from './consts'
import { AugmentedGlobal } from './types'


function getStorage(): ElectronStore {
  return isMain ? (global as AugmentedGlobal).ElectronPiniaStorage : window.ElectronPiniaStorage
}

if (isMain) {
  const { ipcMain } = (global as AugmentedGlobal)
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    const storage = getStorage()
    return storage.get(name)
  })
  ipcMain.handle(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    const storage = getStorage()
    storage.set(name, state)
    return true
  })
  ipcMain.handle(IPC_EVENT_STORE_DELETE, (_, { name }) => {
    const storage = getStorage()
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