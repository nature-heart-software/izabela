import background from './background'
import 'pinia'
import { PluginCustomProperties } from './types'

background.start()

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S, Store> {
        electron?: {
            persisted?: boolean
            shared?: boolean
        }
    }

    export interface PiniaCustomProperties extends PluginCustomProperties {
    }
}

export { plugin as electronPiniaPlugin } from './plugin'
