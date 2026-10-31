import { v4 as uuid } from 'uuid'
import throttle from 'lodash/throttle'
import { watch, type Ref } from 'vue'
import {
  hitboxStoreSessionId,
  useHitboxesStore,
} from '@/modules/vue-hitboxes/hitboxes.store'
import { useDevicePixelRatio } from '@vueuse/core'
import { isGameOverlay } from '@/consts.ts'

export const hitboxClass = 'hitbox'

const selectors = new Set<string>()
const trackedElements = new Map<
  Element,
  { update: () => void; dispose: () => void }
>()
let observer: MutationObserver | undefined
let pixelRatio: Ref<number> | undefined

const onElementChange = (element: Element, callback: () => any) => {
  const resizeObserver = new ResizeObserver(callback)
  const intersectionObserver = new IntersectionObserver(callback)
  const mutationObserver = new MutationObserver(callback)
  resizeObserver.observe(element)
  intersectionObserver.observe(element)
  mutationObserver.observe(element, { attributes: true })
  return () => {
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    mutationObserver.disconnect()
  }
}

const updateHitboxes = () => {
  trackedElements.forEach(({ update }) => update())
}

const synchronizeHitboxes = () => {
  const selector = [...selectors].join(',')
  trackedElements.forEach(({ dispose }, element) => {
    if (!element.isConnected || !element.matches(selector)) {
      trackedElements.delete(element)
      dispose()
    }
  })

  document.querySelectorAll(selector).forEach((element) => {
    if (trackedElements.has(element)) return
    const id = uuid()
    const hitboxesStore = useHitboxesStore()
    const update = throttle(() => {
      if (element.isConnected) {
        const { x, y, width: w, height: h } = element.getBoundingClientRect()
        const scale = pixelRatio?.value || 1
        hitboxesStore.addHitbox({
          sessionId: hitboxStoreSessionId,
          id,
          x: x * scale,
          y: y * scale,
          w: w * scale,
          h: h * scale,
        })
      }
    }, 250)
    const stopObserving = onElementChange(element, update)
    trackedElements.set(element, {
      update,
      dispose() {
        stopObserving()
        update.cancel()
        hitboxesStore.removeHitbox(id)
      },
    })
    update()
  })
}

export const watchHitbox = (selector: string) => {
  if (isGameOverlay || selectors.has(selector)) return
  selectors.add(selector)
  if (!observer) {
    // One renderer-wide subscription also handles detached/reused popovers.
    pixelRatio = useDevicePixelRatio().pixelRatio
    watch(pixelRatio, updateHitboxes)
    window.addEventListener('resize', updateHitboxes)
    window.addEventListener('focus', updateHitboxes)
    observer = new MutationObserver(synchronizeHitboxes)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }
  synchronizeHitboxes()
}

watchHitbox(`.${hitboxClass}`)
