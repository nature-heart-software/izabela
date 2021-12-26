/* eslint-disable */
import merge from 'deepmerge'
import {Store, MutationPayload} from 'vuex'
import type ElectronStore from 'electron-store'

// const STORAGE_NAME = 'vuex';
const STORAGE_KEY = 'state'
const STORAGE_TEST_KEY = 'test'
type ListOption = ((mutation: MutationPayload) => boolean) | string[] | undefined

type Options = {
  whitelist?: ListOption
  blacklist?: ListOption
  storage?: ElectronStore
  storageKey?: string
}
class PersistedState {
  options!: Options
  store!: Store<Partial<unknown>>
  whitelist!: ((mutation: MutationPayload) => boolean)|null
  blacklist!: ((mutation: MutationPayload) => boolean)|null

  constructor(options: Options, store: Store<Partial<unknown>>) {
    this.options = options
    this.store = store
  }

  loadOptions() {
    if (!this.options.storage) this.options.storage = this.createStorage()
    if (!this.options.storageKey) this.options.storageKey = STORAGE_KEY

    this.whitelist = this.loadFilter(this.options.whitelist, 'whitelist')
    this.blacklist = this.loadFilter(this.options.blacklist, 'blacklist')
  }

  createStorage() {
    return typeof window !== 'undefined'
      ? window.ElectronVuexStore
      : (global as typeof global & {ElectronVuexStore: ElectronStore}).ElectronVuexStore
  }

  async getState() {
    return this.options.storage!.get(this.options.storageKey!)
  }

  setState(state: unknown) {
    const sanitizedState = JSON.parse(JSON.stringify(state))
    this.options.storage!.set(this.options.storageKey!, sanitizedState)
  }

  loadFilter(filter: ListOption, name: string) {
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

  filterInArray(list: string[]) {
    return (mutation: MutationPayload) => list.includes(mutation.type)
  }

  checkStorage() {
    try {
      this.options.storage!.set(STORAGE_TEST_KEY, STORAGE_TEST_KEY)
      this.options.storage!.get(STORAGE_TEST_KEY)
      this.options.storage!.delete(STORAGE_TEST_KEY)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  combineMerge(target: any, source: any, options: any) {
    const emptyTarget = (value: any) => (Array.isArray(value) ? [] : {})
    const clone = (value: any, opts: any) => merge(emptyTarget(value), value, opts)
    const destination = target.slice()

    source.forEach((e: any, i: any) => {
      if (typeof destination[i] === 'undefined') {
        const cloneRequested = options.clone !== false
        const shouldClone = cloneRequested && options.isMergeableObject(e)
        destination[i] = shouldClone ? clone(e, options) : e
      } else if (options.isMergeableObject(e)) {
        destination[i] = merge(target[i], e, options)
      } else if (target.indexOf(e) === -1) {
        destination.push(e)
      }
    })

    return destination
  }

  async loadInitialState() {
    const state = await this.getState()

    if (state) {
      const mergedState: unknown = merge(this.store.state, (state as Partial<unknown>), {
        arrayMerge: this.combineMerge,
      })
      this.store.replaceState((mergedState as Partial<unknown>))
    }
  }

  subscribeOnChanges() {
    this.store.subscribe((mutation, state) => {
      if (this.blacklist && this.blacklist(mutation)) return
      if (this.whitelist && !this.whitelist(mutation)) return

      this.setState(state)
    })
  }
}

export default (options: Options) =>
  async (store: Store<Partial<unknown>>) => {
    store.registerModule('electronVuex', {
      namespaced: true,
      state: {
        ready: false,
      },
      mutations: {
        setReady(state: {ready: boolean}, value: boolean) {
          state.ready = value;
        }
      },
      actions: {
        setReady({ commit }, value: boolean) {
          commit('setReady', value);
        },
      }
    });
    const persistedState = new PersistedState(options, store)
    persistedState.loadOptions()
    persistedState.checkStorage()
    await persistedState.loadInitialState()
    persistedState.subscribeOnChanges()
    store.dispatch('electronVuex/setReady', true);
  }
