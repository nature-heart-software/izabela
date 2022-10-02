export const ENGINE_ID = 'uberduck' as const
export const ENGINE_NAME = 'Uberduck' as const
export const LIST_VOICES_QUERY_KEY = 'uberduck-list-voices' as const

export const getVoiceName = (voice: any) => `${voice.display_name}`
