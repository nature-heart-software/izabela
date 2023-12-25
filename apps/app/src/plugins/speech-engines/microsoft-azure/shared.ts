export const ENGINE_ID = 'matts' as const
export const ENGINE_NAME = 'Microsoft Azure' as const
export const LIST_VOICES_QUERY_KEY = 'matts-list-voices' as const
export const getVoiceName = (voice: any) => `${ voice.Locale } ${ voice.DisplayName } - ${ voice.Gender }`
export const getVoiceId = (voice: any) => voice.Name
export const getVoiceCategory = (voice: any) => voice.LocaleName
