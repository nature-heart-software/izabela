import ElectronStore from 'electron-store'
import { bridge, isRenderer } from '@izabela/electron-bridger'

class ElectronVuexStorage {
  store: ElectronStore | null = null

  constructor() {
    this.store = isRenderer ? null : new ElectronStore({ name: 'vuex' })
  }

  ['set'](...args: [string, unknown]) {
    if (!this.store) return
    return this.store.set(...args)
  }

  ['get'](...args: [string]) {
    if (!this.store) return
    return this.store.get(...args)
  }

  ['delete'](...args: [string]) {
    if (!this.store) return
    return this.store.delete(...args)
  }
}

export default bridge.new('ElectronVuexStorage', ElectronVuexStorage)()
