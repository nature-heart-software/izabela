import { useQuery } from 'vue-query'
import { api } from '@/services'

export const useGCTTSListVoicesQuery = (params: {
  apiKey: string
}) => useQuery('gctts-list-voices', () => api.post('/tts/google-cloud/list-voices', params)
  .then(({ data }) => data))

