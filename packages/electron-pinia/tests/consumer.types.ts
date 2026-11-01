import { electronPiniaPlugin, stores, storesStates } from '..'
import { createPinia, defineStore, type PiniaPlugin } from 'pinia'

const plugin: PiniaPlugin = electronPiniaPlugin()
createPinia().use(plugin)
const useCounter = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    add(amount: number) {
      this.count += amount
    },
  },
  electron: { persisted: true, shared: false },
})
const counter = useCounter()
const ready: Promise<boolean> = counter.$whenReady()
const otherReady: Promise<boolean> = storesStates.counter.$whenReady()
counter.add(2)
stores.get('counter')
// @ts-expect-error readiness takes no arguments
counter.$whenReady(true)
// @ts-expect-error electron persistence options are booleans
defineStore('invalid', { state: () => ({}), electron: { persisted: 'yes' } })
// @ts-expect-error action argument types survive the plugin augmentation
counter.add('wrong')
// @ts-expect-error plugin factory has no configuration arguments
electronPiniaPlugin({})
const read: Promise<unknown> = window.ElectronPiniaStorage.get('settings')
window.ElectronPiniaStorage.set('settings', { enabled: true })
window.ElectronPiniaStorage.delete('settings')
// @ts-expect-error storage get is asynchronous
const syncRead: string = window.ElectronPiniaStorage.get('settings')
// @ts-expect-error the bridge does not expose electron-store filesystem operations
window.ElectronPiniaStorage.clear()
// @ts-expect-error registry keys are store ids
stores.get(123)
void [ready, otherReady, read, syncRead]
