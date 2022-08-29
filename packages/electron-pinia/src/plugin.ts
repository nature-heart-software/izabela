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
      if (options.electron.shared)
        state = { ...state, ...shareStatePlugin({ store, options, ...rest }) }
      if (options.electron.persisted)
        state = { ...state, ...persistStatePlugin({ store, options, ...rest }) }
    }
    return state
  }
  return plugin
})()

export default plugin
