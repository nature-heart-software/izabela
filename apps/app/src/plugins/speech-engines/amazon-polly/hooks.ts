import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'

export const listVoicesQueryKey = 'aptts-list-voices'
export const useListVoicesQuery = (
  params: Ref<{ credentials: { identityPoolId: string; region: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    listVoicesQueryKey,
    () => api.post('/tts/amazon-polly/list-voices', params.value).then(({ data }) => data),
    options,
  )
