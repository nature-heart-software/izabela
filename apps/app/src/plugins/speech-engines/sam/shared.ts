export const ENGINE_ID = 'samtts' as const
export const ENGINE_NAME = 'Sam' as const

export const getVoiceName = (voice: any) => voice.name

export const defaultVoice = {
  name: 'Default',
  speed: 72,
  speech: 64,
  throat: 128,
  mouth: 128,
}
export const voices = [
  defaultVoice,
  {
    name: 'Elf',
    speed: 72,
    speech: 64,
    throat: 110,
    mouth: 160,
  },
  {
    name: 'Little Robot',
    speed: 92,
    speech: 60,
    throat: 190,
    mouth: 190,
  },
  {
    name: 'Stuffy Guy',
    speed: 92,
    speech: 72,
    throat: 110,
    mouth: 105,
  },
  {
    name: 'Little Old Lady',
    speed: 82,
    speech: 32,
    throat: 145,
    mouth: 145,
  },
  {
    name: 'Extra-Terrestrial',
    speed: 100,
    speech: 64,
    throat: 150,
    mouth: 200,
  },
]
