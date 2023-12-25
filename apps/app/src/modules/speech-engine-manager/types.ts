import { AxiosResponse } from 'axios'
import { Component } from 'vue'
import { definePluginStore } from '@/store'
import { SpeechCommand } from '@/features/speech/types'

export type Credentials = { [key: string]: any }
export type Payload = { [key: string]: any }

export interface SpeechEngine {
  id: string
  name: string
  category: 'cloud' | 'local' | 'other'
  getVoiceName: (voice: any) => string
  getSelectedVoice: () => any
  getCredentials: () => Credentials
  getLanguageCode: (voice?: any) => string
  getPayload: (options: { text: string; voice: any; translatedText: string | null }) => Payload
  synthesizeSpeech: (context: {
    credentials: Credentials
    payload: Payload
  }) => Promise<AxiosResponse<Blob>> | Promise<Blob>
  hasCredentials?: () => boolean
  voiceSelectComponent: Component
  settingsComponent: Component
  commands?: (voice: any) => SpeechCommand[]
  store: ReturnType<typeof definePluginStore>
}
