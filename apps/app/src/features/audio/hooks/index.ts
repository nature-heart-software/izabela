import { useQuery } from 'vue-query'

export const useIsVirtualAudioCableInstalled = () =>
  useQuery<boolean>('isVirtualAudioCableInstalled', () =>
    window.ElectronResources.isVirtualAudioCableInstalled(),
  )
