import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import debounce from 'lodash/debounce'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'

import {
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
} from './consts'
import { Deferred, purify } from '@packages/toolbox'
import { isMain } from './electron'
import { ref } from 'vue'

function getStorage(): ElectronStore {
  return isMain ? global.ElectronPiniaStorage : window.ElectronPiniaStorage
}

const storageSetState = isMain // debounce to prevent too many writes to the disk
  ? debounce((name: string, state: any) => getStorage().set(name, state), 1000)
  : (name: string, state: any) => getStorage().set(name, state)

if (isMain) {
  const { ipcMain } = global
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    const storage = getStorage()
    return storage.get(name)
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    storageSetState(name, state)
    return true
  })
  ipcMain.on(IPC_EVENT_STORE_DELETE, (_, { name }) => {
    const storage = getStorage()
    storage.delete(name)
    return true
  })
}

export const persistStatePlugin: PiniaPlugin = ({ store }) => {
  const $isReady = ref(false)
  const deferredIsReady = Deferred<boolean>()
  const storage = getStorage()

  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storageSetState(getStorageName(store.$id), sanitizedState)
  }, 1000)

  async function getState() {
    return (await storage.get(getStorageName(store.$id))) || {}
  }

  function getStorageName(storeId: PiniaPluginContext['store']['$id']) {
    return `electron-pinia-${storeId}`
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

  loadInitialState()
    .then(() => {
      $isReady.value = true
      deferredIsReady.resolve(true)
      store.$subscribe((_, state) => setState(state))
    })
    .catch(() => {
      deferredIsReady.reject(false)
    })
  return {
    $isReady,
    $whenReady: () => deferredIsReady.promise,
  }
}
