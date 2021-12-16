import { createStore } from 'vuex';

import {
  createPersistedState,
  createSharedMutations,
} from '@/modules/electron-vuex';

export default createStore({
  state: {
    hello: 'world',
  },
  getters: {},
  mutations: {
    setHello(state, value) {
      state.hello = value;
    },
  },
  actions: {
    setHello({ commit }, value) {
      commit('setHello', value);
    },
  },
  modules: {},
  plugins: [createPersistedState(), createSharedMutations()],
});
