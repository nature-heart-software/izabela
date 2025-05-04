import { Component } from 'vue'
import { definePluginStore } from '@/store'

export type Credentials = { [key: string]: any }

export interface TranslationEngine {
  id: string
  name: string
  getCredentials: () => Credentials
  hasCredentials?: () => boolean
  settingsComponent: Component
  store: ReturnType<typeof definePluginStore>

  translate(text: string, voiceLanguage?: string): Promise<string | null>

  getTranslationOptions(voiceLanguage?: string): {
    translateFrom: string
    translateTo: string
  }
}
