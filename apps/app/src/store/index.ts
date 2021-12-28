import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'
import tailwindConfig from '@/tailwind.config'

export default createStore({
  getters: {
    theme() {
      return tailwindConfig.theme.extend
    }
  },
  modules: {
    messenger,
  },
  plugins: [
    ...(process.env.STORYBOOK ? [] : [
      createPersistedState({
        whitelist: (mutation: MutationPayload) => mutation.type.includes('setPersisted'),
      }),
      createSharedMutations(),
    ]),
  ]
})
