import { useQuery } from 'vue-query'
import { api } from '@/services'
import { Ref } from 'vue'

export const useGCTTSListVoicesQuery = (params: Ref<{ credentials: { apiKey: string } }>) =>
  useQuery('gctts-list-voices', () =>
    api.post('/tts/google-cloud/list-voices', params.value).then(({ data }) => data),
  )

export const useIWTTSListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string; url: string } }>,
) =>
  useQuery('iwtts-list-voices', () =>
    api.post('/tts/ibm-watson/list-voices', params.value).then(({ data }) => data),
  )

export const useMATTSListVoicesQuery = (
  params: Ref<{ credentials: { apiKey: string; region: string } }>,
) =>
  useQuery('matts-list-voices', () =>
    api.post('/tts/microsoft-azure/list-voices', params.value).then(({ data }) => data),
  )

export const useAPTTSListVoicesQuery = (
  params: Ref<{ credentials: { identityPoolId: string; region: string } }>,
) =>
  useQuery('aptts-list-voices', () =>
    api.post('/tts/amazon-polly/list-voices', params.value).then(({ data }) => data),
  )

export const useSayTTSListVoicesQuery = () =>
  useQuery('saytts-list-voices', () => api.post('/tts/say/list-voices').then(({ data }) => data))
