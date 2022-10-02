import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './shared'

export const useListVoicesQuery = (
  params: Ref<{ credentials: { identityPoolId: string; region: string } }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () => api.post('/tts/amazon-polly/list-voices', params.value).then(({ data }) => data),
    options,
  )
