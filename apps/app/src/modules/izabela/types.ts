import { SpeechEngine } from '@/modules/speech-engine-manager/types'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessage {
  id?: string
  message: string
  originalMessage: string
  translatedMessage: string | null
  translatedFrom: string | null
  translatedTo: string
  command: string | null
  engine: SpeechEngine['id']
  voice: any
  excludeFromHistory?: boolean
  disableAutoplay?: boolean
}

export interface IzabelaMessagePayload extends IzabelaMessage {
  credentials: {
    [key: string]: any
  }
  payload: {
    [key: string]: any
  }
}

export interface IzabelaHistoryMessage extends Omit<IzabelaMessagePayload, 'credentials'> {
  id: string
  createdAt: string
}
