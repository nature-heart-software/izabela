import { useQuery } from 'vue-query'
import { useDevicesList } from '@vueuse/core'
import { computed } from 'vue'
import { soxMediaInputsFilter } from '@/utils/media-devices'

export const useIsVirtualAudioCableInstalled = () =>
  useQuery<boolean>('isVirtualAudioCableInstalled', () =>
    window.ElectronResources.isVirtualAudioCableInstalled(),
  )

export const useSoxDevicesList = () => {
  const { audioInputs } = useDevicesList()
  return computed(() => soxMediaInputsFilter(audioInputs.value))
}
