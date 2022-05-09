import { useQuery } from 'vue-query'
import { api } from '@/services'
import { Computed } from 'vue'

export const useGCTTSListVoicesQuery = (params: Computed<{ credentials: { apiKey: string } }>) =>
  useQuery('gctts-list-voices', () =>
    api.post('/tts/google-cloud/list-voices', params.value).then(({ data }) => data),
  )

export const useGCTTSSynthesizeSpeechQuery = (params: {
  credentials: { apiKey: string }
  payload: any
}) =>
  useQuery('gctts-synthesize-speech', () =>
    api.post('/tts/google-cloud/synthesize-speech', params).then(({ data }) => data),
  )
