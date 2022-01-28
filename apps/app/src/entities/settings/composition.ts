import { TippyOptions, useTippy } from 'vue-tippy'
import NvSettings from '@/entities/settings/components/Settings/NvSettings.vue'
import { ref, Ref } from 'vue'
import { TippyHookInstance, TippyTarget } from '@/types/vue-tippy'

export type UseSettingsOptions = {
  popoverTarget?: TippyTarget
  popoverOptions?: TippyOptions
}
export const useSettings = ({ popoverTarget, popoverOptions }: UseSettingsOptions) => {
  const popover: Ref<TippyHookInstance | undefined> = ref()
  if (popoverTarget) {
    popover.value = useTippy(popoverTarget, {
      triggerTarget: popoverOptions?.triggerTarget,
      content: NvSettings,
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
