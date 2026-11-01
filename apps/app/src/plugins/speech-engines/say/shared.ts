export const ENGINE_ID = 'saytts' as const
export const ENGINE_NAME = 'Say' as const
export const LIST_VOICES_QUERY_KEY = 'saytts-list-voices' as const

export const getVoiceName = (voice: any) => voice || 'Default'
export const getVoiceId = (voice: any) => voice
export const getVoiceCategory = (voice: any) => 'General'
