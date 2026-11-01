import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import {
  getVoiceId,
  LIST_VOICES_QUERY_KEY,
  preferredDefaultVoiceId,
} from './shared'
import { getProperty, setProperty } from './store'
import { engine } from './register.ts'

export const useListVoicesQuery = (
  params: Ref<{ credentials: ReturnType<typeof engine.getCredentials> }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      api(getProperty('useLocalCredentials') ? 'local' : 'remote')
        .post('/tts/amazon-polly/list-voices', params.value)
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

          const updatedVoice = data.find(
            (voice) =>
              selectedVoice && getVoiceId(voice) === getVoiceId(selectedVoice),
          )

          const finalVoice = updatedVoice || defaultVoice
          if (!finalVoice) {
            setProperty('selectedVoice', null)
            return
          }
          // A saved voice may advertise engines unavailable in the new region
          // or voice listing. Preserve preference only among supported engines.
          const preferredEnginesSet = new Set([
            ...(selectedVoice?.SupportedEngines || []).filter(
              (engine: string) => finalVoice.SupportedEngines.includes(engine),
            ),
            ...finalVoice.SupportedEngines,
          ])

          setProperty('selectedVoice', {
            ...finalVoice,
            SupportedEngines: Array.from(preferredEnginesSet.values()),
          })
        }
      },
    },
  )
