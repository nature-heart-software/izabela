export const ENGINE_ID = 'izabelatts' as const
export const ENGINE_NAME = 'Izabela' as const
export const LIST_VOICES_QUERY_KEY = 'izabelatts-list-voices' as const
export const getVoiceName = (voice: any) => voice?.name || 'Default'
