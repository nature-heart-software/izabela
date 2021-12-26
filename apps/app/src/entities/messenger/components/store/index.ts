const messengerStore = {
  namespaced: true,
  state: {
    persisted: {
      position: {
        transform: 'matrix(1, 0, 0, 1, 0, 0) translate(0px, 0px)',
        width: 768,
        height: 200,
      },
    },
  },
  getters: {
    persisted: (state: any) => state.persisted,
  },
  mutations: {
    setPersisted(state: any, value: any) {
      state.persisted = value;
    },
  },
  actions: {
    setPersisted({ commit }: any, value: any) {
      commit('setPersisted', value);
    },
  },
}

export default messengerStore;
