import ready from '@ryanmorr/ready'
import { v4 as uuid } from 'uuid'
import throttle from 'lodash/throttle'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { useDevicePixelRatio } from '@vueuse/core'

export const hitboxClass = 'hitbox'

const onElementChange = (element: Element, callback: () => any) => {
    const resizeObserver = new ResizeObserver(callback)
    const intersectionObserver = new IntersectionObserver(callback)
    const mutationObserver = new MutationObserver(callback)
    resizeObserver.observe(element)
    intersectionObserver.observe(element)
    mutationObserver.observe(element, { attributes: true })
    window.addEventListener('resize', callback)
    return () => {
        resizeObserver.unobserve(element)
        intersectionObserver.unobserve(element)
        mutationObserver.disconnect()
        window.removeEventListener('resize', callback)
    }
}
export const watchHitbox = (selector: string) => {
    ready(selector, (element: Element) => {
        const id = uuid()
        const hitboxesStore = useHitboxesStore()
        const { pixelRatio } = useDevicePixelRatio()
        const updateHitboxes = throttle(() => {
            if (element) {
                const { x, y, width: w, height: h } = element.getBoundingClientRect()
                hitboxesStore.addHitbox({
                    id,
                    x: x * pixelRatio.value,
                    y: y * pixelRatio.value,
                    w: w * pixelRatio.value,
                    h: h * pixelRatio.value,
                })
            } else {
                hitboxesStore.removeHitbox(id)
            }
        }, 250)
        onElementChange(element, updateHitboxes)
    })
}

watchHitbox(`.${ hitboxClass }`)
