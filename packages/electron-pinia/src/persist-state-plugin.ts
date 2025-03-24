import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import defaults from 'lodash/defaults'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'

import { ELECTRON_STORAGE_NAME, IPC_EVENT_STORE_DELETE, IPC_EVENT_STORE_GET, IPC_EVENT_STORE_SET } from './consts'
import { Deferred, purify } from '@packages/toolbox'
import { isMain } from './electron'

let electronStores: any = {}

function getElectronStore(name: string) {
  if (!electronStores[name]) {
    let defaults
    try {
      const electronPiniaDefaultFile = require('path').join(require('electron').app.getPath('userData'), `${ ELECTRON_STORAGE_NAME }.json`)
      const globalDefaults: Record<string, any> = require(electronPiniaDefaultFile)
      if (globalDefaults) {
        defaults = {
          [name]: globalDefaults[name],
        }
      }
    } catch (e) {
    }
    electronStores[name] = new (require('electron-store'))({
      name,
      defaults,
      cwd: ELECTRON_STORAGE_NAME,
    })
  }
  return electronStores[name]
}

function getStorage(name: string): ElectronStore {
  return isMain ? getElectronStore(name) : window.ElectronPiniaStorage
}

const storageGetState = (name: string) => getStorage(name).get(name)
const storageSetState = (name: string, state: any) => getStorage(name).set(name, state)
const storageDelete = (name: string) => getStorage(name).delete(name)

if (isMain) {
  const { ipcMain } = require('electron')
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    return storageGetState(name)
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    storageSetState(name, state)
    return true
  })
  ipcMain.on(IPC_EVENT_STORE_DELETE, (_, { name }) => {
    storageDelete(name)
    return true
  })
}

export const persistStatePlugin = ({ store }: Parameters<PiniaPlugin>[0]) => {
  const deferredIsReady = Deferred<boolean>()
  const storage = getStorage(getStorageName(store.$id))

  const setState = (state: any) => {
    const sanitizedState = purify(state)
    storageSetState(getStorageName(store.$id), sanitizedState)
  }

  async function getState() {
    return (await storage.get(getStorageName(store.$id))) || {}
  }

  function getStorageName(storeId: PiniaPluginContext['store']['$id']) {
    return `${ ELECTRON_STORAGE_NAME }-${ storeId }`
  }

  async function loadInitialState() {
    const state = await getState()
    if (state) {
      const mergedState = defaults(cloneDeep(state), cloneDeep(store.$state))
      store.$patch(mergedState)
    }
    return true
  }

  loadInitialState()
    .then(() => {
      deferredIsReady.resolve(true)
      store.$subscribe((_, state) => setState(state))
    })
    .catch(() => {
      deferredIsReady.reject(false)
    })
  return deferredIsReady.promise
}
