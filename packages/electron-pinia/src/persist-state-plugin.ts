import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import defaults from 'lodash/defaults'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'
import { createStore } from './create-store'

import {
  ELECTRON_STORAGE_NAME,
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
} from './consts'
import { Deferred, purify } from '@packages/toolbox'
import { isMain } from './electron'

let electronStores: any = {}

function getElectronStore(name: string) {
  if (!electronStores[name]) {
    let defaults
    try {
      const electronPiniaDefaultFile = require('path').join(
        require('electron').app.getPath('userData'),
        `${ELECTRON_STORAGE_NAME}.json`,
      )
      const globalDefaults: Record<string, any> = JSON.parse(
        require('fs').readFileSync(electronPiniaDefaultFile, 'utf8'),
      )
      if (globalDefaults) {
        defaults = {
          [name]: globalDefaults[name],
        }
      }
    } catch (e) {}
    const options = {
      name,
      defaults,
      cwd: ELECTRON_STORAGE_NAME,
    }
    electronStores[name] = createStore(require('electron-store'), options, () =>
      require('electron').app.getPath('userData'),
    )
  }
  return electronStores[name]
}

function getStorage(
  name: string,
): ElectronStore | Window['ElectronPiniaStorage'] {
  return isMain ? getElectronStore(name) : window.ElectronPiniaStorage
}

const storageGetState = (name: string) => getStorage(name).get(name)
const storageSetState = (name: string, state: any) => {
  try {
    getStorage(name).set(name, state)
    return true
  } catch (error) {
    // Keep the live store usable and the previous atomic save intact. A later
    // state change retries persistence after a locked/full disk recovers.
    console.error(`[electron-pinia] Unable to save ${name}:`, error)
    return false
  }
}
const storageDelete = (name: string) => getStorage(name).delete(name)

if (isMain) {
  const { ipcMain } = require('electron') as typeof import('electron')
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    return storageGetState(name)
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    return storageSetState(name, state)
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
    return `${ELECTRON_STORAGE_NAME}-${storeId}`
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
