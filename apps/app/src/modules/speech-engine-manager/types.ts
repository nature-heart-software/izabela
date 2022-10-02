import { AxiosResponse } from 'axios'
import { Component } from 'vue'
import { definePluginStore } from '@/store'

export type Credentials = { [key: string]: any }
export type Payload = { [key: string]: any }

export interface SpeechEngine {
  id: string
  name: string
  getVoiceName: (voice: any) => string
  getSelectedVoice: () => any
  getCredentials: () => Credentials
  getLanguageCode: () => string
  getPayload: (text: string) => Payload
  synthesizeSpeech: (context: {
    credentials: Credentials
    payload: Payload
  }) => Promise<AxiosResponse<Blob>>
  hasCredentials?: () => boolean
  voiceSelectComponent: Component
  settingsComponent: Component
  commands?: (voice: Record<any, any>) => {
    name: string
    value: string
    description?: string
  }[]
  store: ReturnType<typeof definePluginStore>
}
