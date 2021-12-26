import merge from 'deepmerge'

// const STORAGE_NAME = 'vuex';
const STORAGE_KEY = 'state'
const STORAGE_TEST_KEY = 'test'

class PersistedState {
  options: any = null
  store: any = null
  whitelist: any = null
  blacklist: any = null

  constructor(options: any, store: any) {
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
      : (global as any).ElectronVuexStore
  }

  async getState() {
    return this.options.storage.get(this.options.storageKey)
  }

  setState(state: any) {
    const sanitizedState = JSON.parse(JSON.stringify(state))
    this.options.storage.set(this.options.storageKey, sanitizedState)
  }

  loadFilter(filter: any, name: any) {
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

  filterInArray(list: any) {
    return (mutation: any) => list.includes(mutation.type)
  }

  checkStorage() {
    try {
      this.options.storage.set(STORAGE_TEST_KEY, STORAGE_TEST_KEY)
      this.options.storage.get(STORAGE_TEST_KEY)
      this.options.storage.delete(STORAGE_TEST_KEY)
    } catch (error) {
      throw new Error((error as any).message)
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
      const mergedState = merge(this.store.state, state, {
        arrayMerge: this.combineMerge,
      })
      this.store.replaceState(mergedState)
    }
  }

  subscribeOnChanges() {
    this.store.subscribe((mutation: any, state: any) => {
      if (this.blacklist && this.blacklist(mutation)) return
      if (this.whitelist && !this.whitelist(mutation)) return

      this.setState(state)
    })
  }
}

export default (options = {}) =>
  async (store: any) => {
    const persistedState = new PersistedState(options, store)

    persistedState.loadOptions()
    persistedState.checkStorage()
    await persistedState.loadInitialState()
    persistedState.subscribeOnChanges()
  }
