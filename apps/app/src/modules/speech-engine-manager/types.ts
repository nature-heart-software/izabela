import { AxiosResponse } from 'axios'
import { Component } from 'vue'

export type Credentials = { [key: string]: any }
export type Payload = { [key: string]: any }
type Lazy<T> = () => Promise<T>

export interface SpeechEngine {
  id: string
  name: string
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
}