import { createStore, MutationPayload } from 'vuex'

import { createPersistedState, createSharedMutations } from '@/modules/electron-vuex'
import messenger from '@/entities/messenger/components/store'
import { SetPropertyPayload } from '@/utils/vuex'

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
