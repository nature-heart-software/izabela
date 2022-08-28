import { createPinia, PiniaPlugin } from 'pinia'
import { persistState } from '@/persist-state'
import { shareState } from '@/share-state'
import { StoreOptions } from '@/types'
import { isMain } from '@/consts'
import { createApp, h } from 'vue'

if (isMain) {
  createApp(h({})).use(createPinia())
}

export const plugin = (() => {
  const stores = new Map()
  const plugin: PiniaPlugin = ({ store, options: storeOptions, ...rest }) => {
    const options = storeOptions as StoreOptions
    let state = {}
    if (options.electron) {
      stores.set(store.$id, store)
      if (options.electron.shared)
        state = { ...state, ...shareState({ store, options, ...rest }) }
      if (options.electron.persisted)
        state = { ...state, ...persistState({ store, options, ...rest }) }
    }
    return state
  }
  return plugin
})()

export default plugin
