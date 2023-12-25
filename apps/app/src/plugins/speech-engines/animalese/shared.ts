export const ENGINE_ID = 'animalesetts' as const
export const ENGINE_NAME = 'Animalese' as const
export const getVoiceName = (voice: any) => voice.name
export const getVoiceId = (voice: any) => voice.name

export const getVoiceCategory = (voice: any) => voice.category || 'Other'
export const defaultVoice = {
  name: 'Default',
  pitch: 1,
  shortened: false,
}
