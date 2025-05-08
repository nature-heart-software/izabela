import { Component } from 'vue'
import { definePluginStore } from '@/store'

export type Credentials = { [key: string]: any }

export interface SpeechRecognitionEngine {
  id: string
  name: string
  category: string
  getCredentials: () => Credentials
  hasCredentials: () => boolean
  settingsComponent?: Component | null
  recognitionFn?: (context: any) =>
    | {
        startStream: () => void
        stopStream: () => void
        cleanup: () => void
      }
    | undefined
  store: ReturnType<typeof definePluginStore>
}
