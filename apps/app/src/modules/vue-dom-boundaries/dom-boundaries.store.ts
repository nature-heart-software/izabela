import { Plugin } from 'vuex'
import { SESSION_ID } from '@/consts'
import { Boundary } from './types'

export default (): Plugin<any> => (store) => {
  store.registerModule<{ boundaries: Boundary[] }>('dom-boundaries', {
    namespaced: true,
    state: {
      boundaries: [],
    },
    mutations: {
      setBoundaries(state, value) {
        state.boundaries = value
      },
    },
    getters: {
      state: (state) => state,
      boundaries: (state) => state.boundaries.filter((i) => i.sessionId === SESSION_ID),
    },
    actions: {
      addBoundary({ commit, getters }, boundary: Boundary) {
        const newBoundaries = [...getters.boundaries]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === boundary.id)
        if (boundaryIndex < 0) {
          newBoundaries.push({ ...boundary, sessionId: SESSION_ID })
        } else {
          newBoundaries.splice(boundaryIndex, 1, { ...boundary, sessionId: SESSION_ID })
        }
        commit('setBoundaries', newBoundaries)
      },
      removeBoundary({ commit, getters }, boundary: Boundary) {
        const newBoundaries = [...getters.boundaries]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === boundary.id)
        if (boundaryIndex >= 0) {
          newBoundaries.splice(boundaryIndex, 1)
        }
        commit('setBoundaries', newBoundaries)
      },
    },
  })
}
