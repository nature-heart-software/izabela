export const ENGINE_ID = 'iwtts' as const
export const ENGINE_NAME = 'IBM Watson' as const
export const LIST_VOICES_QUERY_KEY = 'iwtts-list-voices' as const
export const getVoiceName = (voice: any) => `${ voice.name } - ${ voice.gender }`
export const getVoiceId = (voice: any) => voice.name
export const getVoiceCategory = (voice: any) => 'Other'
