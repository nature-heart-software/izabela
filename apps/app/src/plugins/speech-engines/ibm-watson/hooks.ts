import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './consts'

export const useListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string; url: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () => api.post('/tts/ibm-watson/list-voices', params.value).then(({ data }) => data),
    options,
  )
