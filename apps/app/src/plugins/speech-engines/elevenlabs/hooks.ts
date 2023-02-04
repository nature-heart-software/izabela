import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import axios from 'axios'
import { LIST_VOICES_QUERY_KEY } from './shared'

export const useListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      axios
        .get('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': params.value.credentials.apiKey,
          },
        })
        .then(({ data }) => data.voices),
    options,
  )
