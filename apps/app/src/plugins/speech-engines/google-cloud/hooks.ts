import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'

export const listVoicesQueryKey = 'gctts-list-voices'
export const useListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    listVoicesQueryKey,
    () => api.post('/tts/google-cloud/list-voices', params.value).then(({ data }) => data),
    options,
  )
