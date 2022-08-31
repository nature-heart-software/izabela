import { PiniaPlugin } from 'pinia'
import { persistStatePlugin } from './persist-state-plugin'
import { shareStatePlugin } from './share-state-plugin'
import { StoreOptions } from './types'

export const plugin = (() => {
  const stores = new Map()
  const plugin: PiniaPlugin = ({ store, options: storeOptions, ...rest }) => {
    const options = storeOptions as StoreOptions
    let state = {}
    if (options.electron) {
      stores.set(store.$id, store)
      // TODO: if pesisted, await for it to be loaded to load the shared state,
      //  this will prevent watches to be triggered unecessesarily
      if (options.electron.persisted)
        state = { ...state, ...persistStatePlugin({ store, options, ...rest }) }
      if (options.electron.shared)
        state = { ...state, ...shareStatePlugin({ store, options, ...rest }) }
    }
    return state
  }
  return plugin
})()

export default plugin
