import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'

export const listVoicesQueryKey = 'matts-list-voices'
export const useListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string; region: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    listVoicesQueryKey,
    () => api.post('/tts/microsoft-azure/list-voices', params.value).then(({ data }) => data),
    options,
  )
