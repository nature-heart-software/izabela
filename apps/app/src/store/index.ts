import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'
const theme = require('@/theme')

export default createStore({
  getters: {
    theme() {
      return theme.extend
    },
  },
  modules: {
    messenger,
  },
  plugins: [
    ...(process.env.STORYBOOK
      ? []
      : [
          createPersistedState({
            whitelist: (mutation: MutationPayload) => mutation.type.includes('setPersisted'),
          }),
          createSharedMutations(),
        ]),
  ],
})
