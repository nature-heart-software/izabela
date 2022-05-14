import ready from '@ryanmorr/ready'
import { v4 as uuid } from 'uuid'
import { throttle } from 'lodash'
import store from '@/store'

export const domBoundaryClass = 'dom-boundary'

const onElementChange = (element: Element, callback: () => any) => {
  const resizeObserver = new ResizeObserver(callback)
  const intersectionObserver = new IntersectionObserver(callback)
  const mutationObserver = new MutationObserver(callback)
  resizeObserver.observe(element)
  intersectionObserver.observe(element)
  mutationObserver.observe(element, { attributes: true })
  return () => {
    resizeObserver.unobserve(element)
    intersectionObserver.unobserve(element)
    mutationObserver.disconnect()
  }
}
export const watchBoundary = (selector: string) => {
  ready(selector, (element: Element) => {
    const id = uuid()
    const updateBoundary = throttle(() => {
      if (store.hasModule('dom-boundaries')) {
        if (element) {
          const { x, y, width: w, height: h } = element.getBoundingClientRect()
          store.dispatch('dom-boundaries/addBoundary', { id, x, y, w, h })
        } else {
          store.dispatch('dom-boundaries/removeBoundary', { id })
        }
      }
    }, 250)
    onElementChange(element, updateBoundary)
  })
}

watchBoundary(`.${domBoundaryClass}`)
