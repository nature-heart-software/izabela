import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'

export const listVoicesQueryKey = 'iwtts-list-voices'
export const useListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string; url: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    listVoicesQueryKey,
    () => api.post('/tts/ibm-watson/list-voices', params.value).then(({ data }) => data),
    options,
  )
