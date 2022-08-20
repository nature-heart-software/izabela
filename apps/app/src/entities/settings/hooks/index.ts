import { useQuery } from 'vue-query'
import { TippyHookInstance, TippyTarget } from '@/types/vue-tippy'
import { TippyOptions, useTippy } from 'vue-tippy'
import { h, ref, Ref } from 'vue'
import NvSettings from '@/entities/settings/components/NvSettings.vue'
import { tokens } from '@packages/ui/'

const { ElectronFilesystem } = window

export const getGoogleCloudSpeechCredentialsPathQueryKey = 'getGoogleCloudSpeechCredentialsPath'

export const useGetGoogleCloudSpeechCredentialsPath = () =>
  useQuery(getGoogleCloudSpeechCredentialsPathQueryKey, () =>
    ElectronFilesystem.getGoogleCloudSpeechCredentialsPath(),
  )

export type UseSettingsOptions = {
  popoverTarget?: TippyTarget
  popoverOptions?: TippyOptions
}

export const useSettingsPopover = ({ popoverTarget, popoverOptions }: UseSettingsOptions) => {
  const popover: Ref<TippyHookInstance | undefined> = ref()
  if (popoverTarget) {
    popover.value = useTippy(popoverTarget, {
      triggerTarget: popoverOptions?.triggerTarget,
      content: h(NvSettings, {
        onClose: () => popover.value?.hide(),
      }),
      trigger: 'click',
      theme: 'settings',
      interactive: true,
      appendTo: () => document.body,
      maxWidth: 'none',
      offset: [0, tokens.spacing['4']],
    })
  }
  return {
    popover,
  }
}
