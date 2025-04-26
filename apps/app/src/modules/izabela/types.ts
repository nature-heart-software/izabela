import { SpeechEngine } from '@/modules/speech-engine-manager/types'

export type IzabelaMessageEvent =
  | 'started'
  | 'ended'
  | 'timeupdate'
  | 'error'
  | 'response:data'

export interface IzabelaMessage {
  id?: string
  message: string
  originalMessage: string
  translatedMessage: string | null
  translatedFrom: string | null
  translatedTo: string | null
  command: string | null
  engine: (SpeechEngine['id'] & {}) | 'external-audio'
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

export interface IzabelaHistoryMessage
  extends Omit<IzabelaMessagePayload, 'credentials'> {
  id: string
  createdAt: string
}
