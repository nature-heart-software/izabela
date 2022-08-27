import { TippyHookInstance, TippyTarget } from '@/types/vue-tippy'
import { TippyOptions, useTippy } from 'vue-tippy'
import { h, ref, Ref } from 'vue'
import { tokens } from '@packages/ui'
import { RouterView } from 'vue-router'

export type UseRouterViewPopoverOptions = {
  popoverTarget?: TippyTarget
  popoverOptions?: TippyOptions
}

export const useRouterViewPopover = ({
  popoverTarget,
  popoverOptions,
}: UseRouterViewPopoverOptions) => {
  const popover: Ref<TippyHookInstance | undefined> = ref()
  if (popoverTarget) {
    popover.value = useTippy(popoverTarget, {
      content: h(RouterView, {
        onClose: () => popover.value?.hide(),
      }),
      trigger: 'click',
      interactive: true,
      appendTo: () => document.body,
      maxWidth: 'none',
      offset: [0, tokens.spacing['4']],
      ...popoverOptions,
    })
  }
  return {
    popover,
  }
}
