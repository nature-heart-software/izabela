import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'

export default createStore({
  modules: {
    messenger,
  },
  plugins: [
    createPersistedState({
      whitelist: (mutation: MutationPayload) => mutation.type.includes('setPersisted'),
    }),
    createSharedMutations(),
  ],
})
