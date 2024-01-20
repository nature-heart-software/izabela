import { Ref } from 'vue'
import { Instance } from 'tippy.js'
import { TippyContent, TippyOptions } from 'vue-tippy'

export type TippyHookInstance = {
  tippy: Ref<Instance | undefined>
  refresh: () => void
  refreshContent: () => void
  setContent: (value: TippyContent) => void
  setProps: (value: TippyOptions) => void
  destroy: () => void
  hide: () => void
  show: () => void
  disable: () => void
  enable: () => void
  unmount: () => void
  mount: () => void
  state: Ref<{
    isEnabled: boolean
    isVisible: boolean
    isDestroyed: boolean
    isMounted: boolean
    isShown: boolean
  }>
}

export type TippyTarget = Element | (() => Element) | Ref<Element> | Ref<Element | undefined>
