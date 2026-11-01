import { ExtractPropTypes, inject, PropType, provide, Ref } from 'vue'
import { VirtualizerOptions } from '@tanstack/virtual-core'

export const props = {
  options: {
    type: Object as PropType<Partial<VirtualizerOptions<Element, Element>>>,
    default: () => ({}),
  },
  count: {
    type: Number,
    default: 0,
    required: true,
  },
}
export type Props = ExtractPropTypes<typeof props>

export const virtualListContainerContextKey = Symbol('')
export type VirtualListContainerContext = {
  container: Ref<Element | null>
}
export const provideVirtualListContainerContext = (
  context: VirtualListContainerContext,
) => provide(virtualListContainerContextKey, context)
export const injectVirtualListContainerContext = () =>
  inject<VirtualListContainerContext>(virtualListContainerContextKey)
