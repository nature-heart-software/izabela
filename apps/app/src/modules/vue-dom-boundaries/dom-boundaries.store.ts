import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Boundary } from './types'

export const useDomBoundariesStore = defineStore(
  'dom-boundaries',
  () => {
    const boundaries = ref<Boundary[]>([])
    return {
      boundaries,
      addBoundary(boundary: Boundary) {
        const newBoundaries = [...boundaries.value]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === boundary.id)
        if (boundaryIndex < 0) {
          newBoundaries.push({ ...boundary })
        } else {
          newBoundaries.splice(boundaryIndex, 1, { ...boundary })
        }
        boundaries.value = newBoundaries
      },
      removeBoundary(id: Boundary['id']) {
        const newBoundaries = [...boundaries.value]
        const boundaryIndex = newBoundaries.findIndex((i) => i.id === id)
        if (boundaryIndex >= 0) {
          newBoundaries.splice(boundaryIndex, 1)
        }
        boundaries.value = newBoundaries
      },
    }
  },
  { electron: { shared: true } },
)
