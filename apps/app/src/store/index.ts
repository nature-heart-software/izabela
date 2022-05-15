import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/store'
import settings from '@/entities/settings/store'
import { SetPropertyPayload } from '@/utils/vuex'
import domBoundariesStore from '@/modules/vue-dom-boundaries/dom-boundaries.store'

import theme from '@/styles/tokens'

const store = createStore({
  getters: {
    theme: () => theme,
  },
  modules: {
    messenger,
    settings,
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

export default store
