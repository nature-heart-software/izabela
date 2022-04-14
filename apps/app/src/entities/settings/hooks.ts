import { TippyOptions, useTippy } from 'vue-tippy'
import Settings from '@/entities/settings/components/Settings.vue'
import { ref, Ref, h } from 'vue'
import { TippyHookInstance, TippyTarget } from '@/types/vue-tippy'

export type UseSettingsOptions = {
  popoverTarget?: TippyTarget
  popoverOptions?: TippyOptions
}

export const useSettingsPopover = ({ popoverTarget, popoverOptions }: UseSettingsOptions) => {
  const popover: Ref<TippyHookInstance | undefined> = ref()
  if (popoverTarget) {
    popover.value = useTippy(popoverTarget, {
      triggerTarget: popoverOptions?.triggerTarget,
      content: h(Settings, {
        onClose: () => popover.value?.hide(),
      }),
      trigger: 'click',
      arrow: false,
      theme: 'settings',
      interactive: true,
      appendTo: () => document.body,
      maxWidth: 'none',
      offset: [0, 12],
    })
  }
  return {
    popover,
  }
}
