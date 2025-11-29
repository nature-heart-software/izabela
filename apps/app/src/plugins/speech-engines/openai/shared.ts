import capitalize from 'lodash/capitalize'
export const ENGINE_ID = 'openai-tts' as const
export const ENGINE_NAME = 'OpenAI' as const
export const LIST_VOICES_QUERY_KEY = 'openai-tts-list-voices' as const
export const getVoiceName = (voice: string) => capitalize(voice)
export const getVoiceId = (voice: string) => voice
export const getVoiceCategory = (voice: any) => 'General'
export type Credentials = { apiKey: string }
