import { modifiersEvents } from '@/modules/node-iohook'

export type KeybindingResult = {
  modifiers: typeof modifiersEvents[keyof typeof modifiersEvents]['name'][]
  keys: string[]
  combination: number[]
}

export type Key = {
  code: string
  keyCode: number
  which: number
  key: string
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  charCode: number
}
