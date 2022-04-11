import { Plugin } from 'vuex'

interface Boundary {
  id: string
  x: number
  y: number
  w: number
  h: number
}

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
    actions: {
      addBoundary({ commit, state }, boundary: Boundary) {
        const newBoundaries = [...state.boundaries]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === boundary.id)
        if (boundaryIndex < 0) {
          newBoundaries.push(boundary)
        } else {
          newBoundaries.splice(boundaryIndex, 1, boundary)
        }
        commit('setBoundaries', newBoundaries)
        console.log(state.boundaries)
      },
      removeBoundary({ commit, state }, boundary: Boundary) {
        const newBoundaries = [...state.boundaries]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === boundary.id)
        if (boundaryIndex >= 0) {
          newBoundaries.splice(boundaryIndex, 1)
        }
        commit('setBoundaries', newBoundaries)
      },
    },
  })
}
