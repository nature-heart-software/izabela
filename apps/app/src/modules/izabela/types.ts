import { SpeechEngine } from '@/modules/speech-engine-manager/types'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessagePayload {
  id?: string
  message: string
  engine: SpeechEngine['id']
  voice: Record<any, any>
  credentials: {
    [key: string]: any
  }
  payload: {
    [key: string]: any
  }
  excludeFromHistory?: boolean
  disableAutoplay?: boolean
}

export interface IzabelaHistoryMessage extends Omit<IzabelaMessagePayload, 'credentials'> {
  id: string
  createdAt: string
}
