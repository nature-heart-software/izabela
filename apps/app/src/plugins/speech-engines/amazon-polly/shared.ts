export const ENGINE_ID = 'aptts' as const
export const ENGINE_NAME = 'Amazon Polly' as const
export const LIST_VOICES_QUERY_KEY = 'aptts-list-voices' as const
export const getVoiceName = (voice: any) => `${voice.LanguageCode} ${voice.Name} - ${voice.Gender}`
export const getVoiceId = (voice: any) => voice.Id
export const getVoiceCategory = (voice: any) => voice.LanguageName
