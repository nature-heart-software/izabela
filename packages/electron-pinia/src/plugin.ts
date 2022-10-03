import { PiniaPlugin } from 'pinia'
import { persistStatePlugin } from './persist-state-plugin'
import { shareStatePlugin } from './share-state-plugin'
import { PluginCustomProperties, StoreOptions } from './types'
import { ref } from 'vue'
import 'pinia'
import { Deferred } from '@packages/toolbox'

export const plugin = (() => {
  const plugin: () => PiniaPlugin =
    () =>
    ({ store, options: storeOptions, ...rest }) => {
      const options = storeOptions as StoreOptions
      const { promise: whenAllReady, resolve, reject } = Deferred<boolean>()
      const state: PluginCustomProperties = {
        $isReady: ref(false),
        $whenReady: () => whenAllReady,
      }
      const isPersisted = options.electron?.persisted
      const isShared = options.electron?.shared
      ;(isPersisted
        ? persistStatePlugin({ store, options, ...rest })
        : Promise.resolve(true)
      )
        .then(() =>
          isShared
            ? shareStatePlugin({ store, options, ...rest })
            : Promise.resolve(true),
        )
        .then(() => {
          state.$isReady.value = true
          resolve(true)
        })
        .catch(reject)

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
