import { createStore, MutationPayload } from 'vuex'

import { defaultsDeep, get, set } from 'lodash'
import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
// eslint-disable-next-line import/no-cycle
import settings from '@/features/settings/store'
// eslint-disable-next-line import/no-cycle
import speech from '@/features/speech/store'
import { SetPropertyPayload, utilActions, utilMutations } from '@/utils/vuex'
import domBoundariesStore from '@/modules/vue-dom-boundaries/dom-boundaries.store'
import { decrypt, encrypt } from '@/utils/security'

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
  modules: {
    settings,
    speech,
  },
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
          domBoundariesStore(),
        ]),
  ],
})

export const registerPluginStore = <S extends Record<any, any>>(id: string, state: S) => {
  const pluginPath = ['settings.persisted.plugins', id].join('.')
  const currentPluginState = get(store.state, pluginPath, {})
  const mergedState = defaultsDeep(currentPluginState, state)
  set(store.state, pluginPath, mergedState)
  return {
    setProperty(property: keyof S, value: any, encryptValue = false) {
      const fn = encryptValue ? encrypt : (v: any) => v
      store.dispatch('setProperty', [[pluginPath, property].join('.'), fn(value)])
    },
    getProperty(property: keyof S, decryptValue = false) {
      const fn = decryptValue ? decrypt : (v: any) => v
      return fn(get(store.state, [pluginPath, property].join('.')))
    },
  }
}

export default store
