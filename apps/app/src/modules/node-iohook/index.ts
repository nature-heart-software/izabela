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
  shiftKey: { name: 'shift', rawcode: 16 },
  altKey: { name: 'alt', rawcode: 18 },
  ctrlKey: { name: 'ctrl', rawcode: 17 },
  metaKey: { name: 'meta', rawcode: 91 },
} as const

export default iohook
