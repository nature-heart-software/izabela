import { createStore, MutationPayload } from 'vuex'
import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import { SetPropertyPayload, utilActions, utilMutations } from '@/utils/vuex'
import { decrypt, encrypt } from '@/utils/security'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const store = createStore({
  state: {
    persisted: {
      plugins: {},
    },
  },
  getters: {
    state: (state) => state,
    persisted: (state) => state.persisted,
    isReady: (state: any) => () => Promise.all([state['electron-vuex'].isReady()]),
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
  modules: {},
  plugins: [
    ...(process.env.STORYBOOK
      ? []
      : [
        createPersistedState({
          whitelist: (mutation: MutationPayload) =>
            mutation.type.includes('setPersisted') ||
            (mutation.type.includes('setProperty') &&
              (mutation.payload as SetPropertyPayload)[0].includes('persisted')) ||
            (mutation.type.includes('setProperties') &&
              (mutation.payload as SetPropertyPayload[]).some((payload) =>
                payload[0].includes('persisted'),
              )),
        }),
        createSharedMutations(),
      ]),
  ],
})

export const registerPluginStore = <S extends Record<any, any>>(id: string, state: S) => {
  const usePluginStore = defineStore(`plugin-${ id }`, () => {
    const pluginState = ref<Record<any, any>>(state)
    return {
      pluginState,
    }
  }, { electron: { shared: true, persisted: true } })
  const pluginStore = usePluginStore()
  return {
    setProperty(property: keyof S, value: any, encryptValue = false) {
      const fn = encryptValue ? encrypt : (v: any) => v
      pluginStore.$patch({ pluginState: { [property]: fn(value) } })
    },
    getProperty(property: keyof S, decryptValue = false) {
      const fn = decryptValue ? decrypt : (v: any) => v
      return fn(pluginStore.$state.pluginState[property])
    },
  }
}

export default store
