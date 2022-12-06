import { TippyOptions, useTippy } from 'vue-tippy'
import { h, ref, Ref, unref } from 'vue'
import { tokens } from '@packages/ui'
import { RouterView } from 'vue-router'
import { TippyHookInstance, TippyTarget } from '@/types/vue-tippy'

export type UseRouterViewPopoverOptions = {
  popoverTarget?: TippyTarget
  popoverOptions?: TippyOptions
}

export const useRouterViewPopover = ({
  popoverTarget,
  popoverOptions,
}: UseRouterViewPopoverOptions) => {
  const popover: Ref<TippyHookInstance | undefined> = ref()
  const update = () => {
    unref(popover.value?.tippy)?.popperInstance?.update()
  }
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
      onShow(instance) {
        setTimeout(() => {
          instance.popperInstance?.update()
        })
      },

      onShown(instance) {
        instance.popperInstance?.update()
      },
      hideOnClick: false,
      ...popoverOptions,
    })
  }
  return {
    popover,
    update,
  }
}
