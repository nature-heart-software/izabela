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
// @ts-ignore
import { purify } from '@/utils/object'
import { Deferred } from '@/utils/promise'

const isReady = Deferred()

const PersistedState = (options: PersistedStateOptions, store: Store<unknown>) => {
  const storage = createStorage()
  const whitelist = loadFilter(options.whitelist, 'whitelist')
  const blacklist = loadFilter(options.blacklist, 'blacklist')
  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storage.set(options.storageName || STORAGE_KEY, sanitizedState)
  }, 1000)

  function createStorage(): ElectronStore {
    return typeof window !== 'undefined'
      ? window.ElectronVuexStorage
      : ((global as AugmentedGlobal).ElectronVuexStorage as ElectronStore)
  }

  async function getState() {
    return storage.get(options.storageName || STORAGE_KEY)
  }

  function loadFilter(filter: MutationFilterOption, name: string): MutationFilter | null {
    if (!filter) {
      return null
    }
    if (filter instanceof Array) {
      return filterInArray(filter)
    }
    if (typeof filter === 'function') {
      return filter
    }
    throw new Error(
      `[Vuex Electron] Filter "${ name }" should be Array or Function. Please, read the docs.`,
    )
  }

  function filterInArray(list: string[]): MutationFilter {
    return (mutation) => list.includes(mutation.type)
  }

  function checkStorage() {
    try {
      storage.set(STORAGE_TEST_KEY, STORAGE_TEST_KEY)
      storage.get(STORAGE_TEST_KEY)
      storage.delete(STORAGE_TEST_KEY)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async function loadInitialState() {
    const state = await getState()

    if (state) {
      const mergedState = defaultsDeep(cloneDeep(state), cloneDeep(store.state))
      store.replaceState(mergedState)
    }
  }

  function subscribeOnChanges() {
    store.subscribe((mutation, state) => {
      if (blacklist && blacklist(mutation)) return
      if (whitelist && !whitelist(mutation)) return
      setState(state)
    })
  }

  function createStoreModule() {
    const storeState = {
      isReady: () => isReady.promise,
    }
    store.registerModule<typeof storeState>('electron-vuex', {
      namespaced: true,
      state: storeState,
    })
  }

  return {
    checkStorage,
    subscribeOnChanges,
    createStoreModule,
    loadInitialState,
  }
}

export default (options: PersistedStateOptions): Plugin<unknown> =>
  (store) => {
    const isPreload = !!(typeof window !== 'undefined' && window.ElectronVuexIsPreload)
    if (isPreload) return isReady.resolve(true)
    const persistedState = PersistedState(options, store)
    persistedState.checkStorage()
    persistedState.subscribeOnChanges()
    persistedState.createStoreModule()

    Promise.resolve(persistedState.loadInitialState())
      .then(() => {
        isReady.resolve(true)
      })
      .catch(() => {
        isReady.reject()
      })
  }
