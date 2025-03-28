import { TippyOptions, useTippy } from 'vue-tippy'
import { h, ref, Ref, unref } from 'vue'
import { tokens } from '@packages/ui'
import { RouterView, useRouter } from 'vue-router'
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
  const router = useRouter()
  if (popoverTarget) {
    popover.value = useTippy(popoverTarget, {
      content: h(RouterView, {
        onClose: () => {
          popover.value?.hide()
          // forces refresh of pages when it's opened again
          router.push({ path: '/' })
        },
      }),
      trigger: 'click',
      interactive: true,
      appendTo: () =>
        document.querySelector('#router-overlay') || document.body,
      maxWidth: 'none',
      offset: [0, tokens.spacing['4']],
      placement: 'top-start',
      hideOnClick: false,
      ...popoverOptions,
      onShow(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onShow?.(instance)
      },
      onShown(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onShown?.(instance)
      },
      onCreate(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onCreate?.(instance)
      },
      onHidden(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onHidden?.(instance)
      },
      onMount(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onMount?.(instance)
      },
      onClickOutside(instance, event) {
        instance.popperInstance?.update()
        return popoverOptions?.onClickOutside?.(instance, event)
      },
      onHide(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onHide?.(instance)
      },
      onTrigger(instance, event) {
        instance.popperInstance?.update()
        return popoverOptions?.onTrigger?.(instance, event)
      },
      onDestroy(instance) {
        instance.popperInstance?.update()
        return popoverOptions?.onDestroy?.(instance)
      },
      onUntrigger(instance, event) {
        instance.popperInstance?.update()
        return popoverOptions?.onUntrigger?.(instance, event)
      },
    })
  }
  return {
    popover,
    update,
  }
}
