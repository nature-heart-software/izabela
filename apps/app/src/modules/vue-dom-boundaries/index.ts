import ready from '@ryanmorr/ready'
import { v4 as uuid } from 'uuid'
import { throttle } from 'lodash'
import { useDomBoundariesStore } from '@/modules/vue-dom-boundaries/dom-boundaries.store'

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
    const domBoundariesStore = useDomBoundariesStore()
    const id = uuid()
    const updateBoundary = throttle(() => {
      if (element) {
        const { x, y, width: w, height: h } = element.getBoundingClientRect()
        domBoundariesStore.addBoundary({ id, x, y, w, h })
      } else {
        domBoundariesStore.removeBoundary(id)
      }
    }, 250)
    onElementChange(element, updateBoundary)
  })
}

watchBoundary(`.${domBoundaryClass}`)
