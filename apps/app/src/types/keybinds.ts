import { modifiersEvents } from '@/modules/node-iohook'

export type KeybindingResult = {
  modifiers: typeof modifiersEvents[keyof typeof modifiersEvents]['name'][]
  keys: string[]
  combination: number[]
}
