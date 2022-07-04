import iohook from 'iohook'

if (typeof window === 'undefined') {
  iohook.start()
}

export type IOHookEvent = {
  type: string
  keychar?: number
  keycode?: number
  rawcode?: number
  button?: number
  clicks?: number
  x?: number
  y?: number
}

export type IOHookKeyboardEvent = {
  type: string
  keychar?: number
  keycode: number
  rawcode: number
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

export type IOHookMouseEvent = {
  type: string
  button: number
  clicks: number
  x: number
  y: number
}

export const modifiersEvents = {
  shiftKey: { name: 'shift', keycode: 42 },
  altKey: { name: 'alt', keycode: 56 },
  ctrlKey: { name: 'ctrl', keycode: 29 },
  metaKey: { name: 'meta', keycode: 3675 },
} as const

export default iohook
