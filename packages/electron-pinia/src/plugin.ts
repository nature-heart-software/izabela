import { PiniaPlugin } from 'pinia'
import { persistStatePlugin } from './persist-state-plugin'
import { shareStatePlugin } from './share-state-plugin'
import { PluginCustomProperties, StoreOptions } from './types'

export const plugin = (() => {
  const stores = new Map()
  const plugin: () => PiniaPlugin =
    () =>
    ({ store, options: storeOptions, ...rest }) => {
      const options = storeOptions as StoreOptions
      let state: PluginCustomProperties = {}
      if (options.electron) {
        stores.set(store.$id, store)
        /** load the "persist" plugin first so that it can hydrate the store state without triggering any watcher */
        if (options.electron.persisted) {
            persistStatePlugin({ store, options, ...rest })
        }
        if (options.electron.shared) {
            shareStatePlugin({ store, options, ...rest })
        }
      }
      return state
    }
  return plugin
})()

export default plugin
