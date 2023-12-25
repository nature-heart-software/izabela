export const ENGINE_ID = 'gctts' as const
export const ENGINE_NAME = 'Google Cloud' as const
export const LIST_VOICES_QUERY_KEY = 'gctts-list-voices' as const
export const getVoiceName = (voice: any) => `${voice.name} - ${voice.ssmlGender}`
export const getVoiceId = (voice: any) => voice.name
export const getVoiceCategory = (voice: any) => 'Other'
