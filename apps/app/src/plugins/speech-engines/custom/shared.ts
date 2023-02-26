export const ENGINE_ID = 'customtts' as const
export const ENGINE_NAME = 'Custom' as const
export const LIST_VOICES_QUERY_KEY = 'customtts-list-voices' as const
export const getVoiceName = (voice: any) => voice?.name || 'None'
