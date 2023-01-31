import ready from '@ryanmorr/ready'
import { v4 as uuid } from 'uuid'
import { throttle } from 'lodash'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'

export const hitboxClass = 'hitbox'

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
export const watchHitbox = (selector: string) => {
  ready(selector, (element: Element) => {
    const id = uuid()
    const hitboxesStore = useHitboxesStore()
    const updateHitboxes = throttle(() => {
      if (element) {
        const { x, y, width: w, height: h } = element.getBoundingClientRect()
        hitboxesStore.addHitbox({ id, x, y, w, h })
      } else {
        hitboxesStore.removeHitbox(id)
      }
    }, 250)
    onElementChange(element, updateHitboxes)
  })
}

watchHitbox(`.${ hitboxClass }`)
