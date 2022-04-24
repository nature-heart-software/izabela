import { SPEECH_ENGINES } from '@/entities/speech'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessagePayload<O = any> {
  engine: typeof SPEECH_ENGINES[number]['id']
  credentials: {
    apiKey: string
  }
  payload: string
}
