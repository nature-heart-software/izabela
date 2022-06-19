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

export default iohook
