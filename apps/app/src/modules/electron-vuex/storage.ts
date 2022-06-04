import ElectronStore from 'electron-store'
import { bridge, isRenderer } from '@izabela/electron-bridger'

const createElectronVuexStorage = () => {
  const store: ElectronStore | null = isRenderer ? null : new ElectronStore({ name: 'vuex' })

  return {
    store,
    set(...args: [string, unknown]) {
      if (!store) return
      // eslint-disable-next-line consistent-return
      return store.set(...args)
    },

    get(...args: [string]) {
      if (!store) return
      // eslint-disable-next-line consistent-return
      return store.get(...args)
    },

    delete(...args: [string]) {
      if (!store) return
      // eslint-disable-next-line consistent-return
      return store.delete(...args)
    },
  }
}
const electronVuexStorage = createElectronVuexStorage()

bridge.register([['ElectronVuexStorage', () => electronVuexStorage]])

export default electronVuexStorage
