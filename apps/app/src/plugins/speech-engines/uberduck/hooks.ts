import { useQuery, UseQueryOptions } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './consts'

export const useListVoicesQuery = (
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () => api.post('/tts/uberduck/list-voices').then(({ data }) => data),
    options,
  )
