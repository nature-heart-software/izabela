import { computed } from 'vue'
import { orderBy } from 'lodash'
import { useQuery, useQueryClient } from 'vue-query'

const useEnumerateMediaDevicesQuery = () => useQuery<MediaDeviceInfo[]>('enumerate-media-devices', () => navigator.mediaDevices.enumerateDevices())
const useMediaDevices = () => {
  const queryClient = useQueryClient()
  const { data } = useEnumerateMediaDevicesQuery()
  const mediaDevices = computed(() => data.value || [])
  window.addEventListener('devicechange', () => queryClient.refetchQueries('enumerate-media-devices'))
  const audioInputDevices = computed(() => orderBy(mediaDevices.value.filter((m) => m.kind === 'audioinput'), ['label']))
  const audioOutputDevices = computed(() => orderBy(mediaDevices.value.filter((m) => m.kind === 'audiooutput'), ['label']))
  return {
    audioInputDevices,
    audioOutputDevices,
  }
}

export default useMediaDevices
