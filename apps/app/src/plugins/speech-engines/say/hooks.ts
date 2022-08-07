import { useQuery } from 'vue-query'
import { api } from '@/services'

export const listVoicesQueryKey = 'saytts-list-voices'
export const useListVoicesQuery = () =>
  useQuery(listVoicesQueryKey, () => api.post('/tts/say/list-voices').then(({ data }) => data))
