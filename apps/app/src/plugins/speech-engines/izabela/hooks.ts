import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store.ts'
import { getVoiceId, preferredDefaultVoiceId } from './shared.ts'

export const useListVoicesQuery = (
  params: Ref<Record<string, unknown>>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      api()
        .post('/tts/izabela/list-voices', params.value)
        .then(({ data }) => data),
    {
      ...options,
      onSuccess(data) {
        if (Array.isArray(data)) {
          const selectedVoice = getProperty('selectedVoice')
          const defaultVoice =
            data.find(
              (voice) => getVoiceId(voice) === preferredDefaultVoiceId,
            ) || data[0]
          if (!selectedVoice) {
            setProperty('selectedVoice', defaultVoice)
          } else {
            const updatedVoice = data.find(
              (voice) => getVoiceId(voice) === getVoiceId(selectedVoice),
            )
            setProperty('selectedVoice', updatedVoice || defaultVoice)
          }
        }
      },
    },
  )
