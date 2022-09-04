import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import debounce from 'lodash/debounce'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'

import {
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
  isMain,
  isPreload,
} from './consts'
import { AugmentedGlobal, PluginCustomProperties } from './types'
import { purify } from './utils'

function getStorage(): ElectronStore {
  return isMain
    ? (global as AugmentedGlobal).ElectronPiniaStorage
    : window.ElectronPiniaStorage
}

const storageSetState = isMain // debounce to prevent too many writes to the disk
  ? debounce((name: string, state: any) => getStorage().set(name, state), 1000)
  : (name: string, state: any) => getStorage().set(name, state)

if (isMain) {
  const { ipcMain } = global as AugmentedGlobal
  ipcMain.on(IPC_EVENT_STORE_GET, (event, { name }) => {
    const storage = getStorage()
    event.returnValue = storage.get(name)
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (event, { name, state }) => {
    storageSetState(name, state)
    event.returnValue = true
  })
  ipcMain.on(IPC_EVENT_STORE_DELETE, (event, { name }) => {
    const storage = getStorage()
    storage.delete(name)
    event.returnValue = true
  })
}

export const persistStatePlugin: PiniaPlugin = ({
  store,
}): PluginCustomProperties => {
  const storage = getStorage()
  const loaded = isPreload ? Promise.resolve(true) : Promise.resolve(loadInitialState())

  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storageSetState(getStorageName(store.$id), sanitizedState)
  }, 1000)

  function getState() {
    return storage.get(getStorageName(store.$id)) || {}
  }

  function getStorageName(storeId: PiniaPluginContext['store']['$id']) {
    return `electron-pinia-${storeId}`
  }

  function loadInitialState() {
    const state = getState()
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
    isReady: () => loaded,
  }
}
