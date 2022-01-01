import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'

const theme = require('@/theme')

export default createStore({
  state: {
    env: process.env.NODE_ENV,
  },
  getters: {
    theme: () => theme,
  },
  modules: {
    messenger,
  },
  plugins: [
    ...(process.env.STORYBOOK
      ? []
      : [
          createPersistedState({
            whitelist: (mutation: MutationPayload) =>
              mutation.type.includes('setPersisted') ||
              (Array.isArray(mutation.payload) &&
                typeof mutation.payload[0] === 'string' &&
                mutation.payload[0].includes('persisted')),
          }),
          createSharedMutations(),
        ]),
  ],
})
