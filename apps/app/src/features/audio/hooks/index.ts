import { useQuery } from 'vue-query'
import { computed, type MaybeRef } from 'vue'
import { useAudioDevices } from './devices'
export { useAudioDevices } from './devices'
import { soxMediaInputsFilter } from '@/utils/media-devices'

export const useIsVirtualAudioCableInstalled = () =>
  useQuery<boolean>('isVirtualAudioCableInstalled', () =>
    window.ElectronResources.isVirtualAudioCableInstalled(),
  )

export const useSoxDevicesList = (enabled: MaybeRef<boolean> = true) => {
  const { audioInputs } = useAudioDevices(enabled)
  return computed(() => soxMediaInputsFilter(audioInputs.value))
}
