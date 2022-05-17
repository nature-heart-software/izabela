import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessagePayload {
  engine: SpeechEngine['id']
  credentials: {
    [key: string]: any
  }
  payload: {
    [key: string]: any
  }
}
