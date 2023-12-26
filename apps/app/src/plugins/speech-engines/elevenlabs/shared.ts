import { capitalize } from '@/utils/text'

export const ENGINE_ID = '11labstts' as const
export const ENGINE_NAME = 'ElevenLabs' as const
export const LIST_VOICES_QUERY_KEY = '11labstts-list-voices' as const
export const LIST_MODELS_QUERY_KEY = '11labstts-list-models' as const
export const getVoiceName = (voice: any) => voice.name
export const getVoiceId = (voice: any) => voice.voice_id
export const getVoiceCategory = (voice: any) => capitalize(voice.category)
