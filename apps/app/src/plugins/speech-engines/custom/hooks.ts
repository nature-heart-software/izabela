import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import axios from 'axios'
import { LIST_VOICES_QUERY_KEY } from './shared'
import { engine } from './register.ts'
import { getProperty, setProperty } from './store.ts'
import { getVoiceId, preferredDefaultVoiceId } from './shared.ts'

export const useListVoicesQuery = (
  params: Ref<{
    endpoint: string
    credentials: ReturnType<typeof engine.getCredentials>
  }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      axios
        .post(
          `${
            params.value.endpoint.endsWith('/')
              ? params.value.endpoint.slice(0, -1)
              : params.value.endpoint
          }/list-voices`,
          { credentials: params.value.credentials },
        )
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
