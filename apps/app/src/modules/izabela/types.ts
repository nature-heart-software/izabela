import { SpeechEngine } from '@/modules/speech-engine-manager/types'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessagePayload {
  id?: string
  message: string
  engine: SpeechEngine['id']
  credentials: {
    [key: string]: any
  }
  payload: {
    [key: string]: any
  }
  excludeFromHistory?: boolean
}

export interface IzabelaHistoryMessage extends Omit<IzabelaMessagePayload, 'credentials'> {
  id: string
  createdAt: string
}
