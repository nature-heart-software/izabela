import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty } from './store'
import { engine } from './register'
import { getVoiceId, preferredDefaultVoiceId } from './shared.ts'
import { setProperty } from './store.ts'

export const useListVoicesQuery = (
  params: Ref<{ credentials: ReturnType<typeof engine.getCredentials> }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      api(getProperty('useLocalCredentials') ? 'local' : 'remote')
        .post('/tts/google-cloud/list-voices', params.value)
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
