/* eslint-disable */
import { STORAGE_KEY, STORAGE_TEST_KEY } from './consts'
import {
  AugmentedGlobal,
  MutationFilter,
  MutationFilterOption,
  PersistedStateOptions,
} from './types'
import { Plugin, Store } from 'vuex'
import type ElectronStore from 'electron-store'
import { cloneDeep, debounce, defaultsDeep } from 'lodash'
import mitt from 'mitt'
// @ts-ignore
import { purify } from '@/utils/object'

const emitter = mitt()

class PersistedState {
  options: PersistedStateOptions
  store!: Store<unknown>
  storage!: ElectronStore
  whitelist!: MutationFilter | null
  blacklist!: MutationFilter | null
  setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    this.storage.set(this.options.storageName || STORAGE_KEY, sanitizedState)
  }, 1000)

  constructor(options: PersistedStateOptions, store: Store<unknown>) {
    this.options = options
    this.store = store
    this.storage = this.createStorage()
    this.whitelist = this.loadFilter(this.options.whitelist, 'whitelist')
    this.blacklist = this.loadFilter(this.options.blacklist, 'blacklist')
  }

  createStorage(): ElectronStore {
    return typeof window !== 'undefined'
      ? window.ElectronVuexStorage
      : ((global as AugmentedGlobal).ElectronVuexStorage as ElectronStore)
  }

  async getState() {
    return this.storage.get(this.options.storageName || STORAGE_KEY)
  }

  loadFilter(filter: MutationFilterOption, name: string): MutationFilter | null {
    if (!filter) {
      return null
    }
    if (filter instanceof Array) {
      return this.filterInArray(filter)
    }
    if (typeof filter === 'function') {
      return filter
    }
    throw new Error(
      `[Vuex Electron] Filter "${name}" should be Array or Function. Please, read the docs.`,
    )
  }

  filterInArray(list: string[]): MutationFilter {
    return (mutation) => list.includes(mutation.type)
  }

  checkStorage() {
    try {
      this.storage.set(STORAGE_TEST_KEY, STORAGE_TEST_KEY)
      this.storage.get(STORAGE_TEST_KEY)
      this.storage.delete(STORAGE_TEST_KEY)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async loadInitialState() {
    const state = await this.getState()

    if (state) {
      const mergedState = defaultsDeep(cloneDeep(state), cloneDeep(this.store.state))
      this.store.replaceState(mergedState)
    }
  }

  subscribeOnChanges() {
    this.store.subscribe((mutation, state) => {
      if (this.blacklist && this.blacklist(mutation)) return
      if (this.whitelist && !this.whitelist(mutation)) return
      this.setState(state)
    })
  }

  createStoreModule() {
    const listenToReady = new Promise((resolve) => {
      emitter.on('electron-vuex/persisted-state/ready', () => resolve(true))
      emitter.on('electron-vuex/persisted-state/fail', () => resolve(false))
    })
    const storeState = {
      ready: () => listenToReady,
    }
    this.store.registerModule<typeof storeState>('electron-vuex', {
      namespaced: true,
      state: storeState,
    })
  }
}

export default (options: PersistedStateOptions): Plugin<unknown> =>
  (store) => {
    const isPreload = !!(typeof window !== 'undefined' && window.ElectronVuexIsPreload)
    if (isPreload) return emitter.emit('electron-vuex/persisted-state/ready')
    const persistedState = new PersistedState(options, store)
    persistedState.checkStorage()
    persistedState.subscribeOnChanges()
    persistedState.createStoreModule()
    Promise.resolve(persistedState.loadInitialState())
      .then(() => {
        emitter.emit('electron-vuex/persisted-state/ready')
      })
      .catch(() => {
        emitter.emit('electron-vuex/persisted-state/fail')
      })
  }
