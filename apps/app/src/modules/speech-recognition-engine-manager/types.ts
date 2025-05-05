import { Component } from 'vue'
import { definePluginStore } from '@/store'

export type Credentials = { [key: string]: any }

export interface SpeechRecognitionEngine {
  id: string
  name: string
  category: string
  getCredentials: () => Credentials
  hasCredentials?: () => boolean
  settingsComponent: Component
  store: ReturnType<typeof definePluginStore>
}
