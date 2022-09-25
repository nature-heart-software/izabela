import { PiniaPlugin } from 'pinia'
import { persistStatePlugin } from './persist-state-plugin'
import { shareStatePlugin } from './share-state-plugin'
import { PluginCustomProperties, StoreOptions } from './types'
import { ref } from 'vue'
import 'pinia'

export const plugin = (() => {
  const stores = new Map()
  const plugin: () => PiniaPlugin =
    () =>
    ({ store, options: storeOptions, ...rest }) => {
      const options = storeOptions as StoreOptions
      let state: PluginCustomProperties = {
        $isReady: ref(true),
        $whenReady: () => Promise.resolve(true),
      }
      if (options.electron) {
        stores.set(store.$id, store)
        if (options.electron.persisted) {
          state = {
            ...state,
            ...persistStatePlugin({ store, options, ...rest }),
          }
        }
        if (options.electron.shared) {
          state.$whenReady().then(() => {
            shareStatePlugin({ store, options, ...rest })
          })
        }
      }
      return state
    }
  return plugin
})()

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    electron?: {
      persisted?: boolean
      shared?: boolean
    }
  }

  export interface PiniaCustomProperties extends PluginCustomProperties {}
}

export default plugin
