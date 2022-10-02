import { useQuery } from 'vue-query'
import { api } from '@/services'
import { LIST_VOICES_QUERY_KEY } from './shared'

export const useListVoicesQuery = () =>
  useQuery(LIST_VOICES_QUERY_KEY, () => api.post('/tts/say/list-voices').then(({ data }) => data))
