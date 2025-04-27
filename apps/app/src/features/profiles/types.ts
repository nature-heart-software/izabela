import { Key } from '@/types/keybinds.ts'

export type Profile = {
  id: string
  name: string
  openMessengerOnTrigger: boolean
  shortcut: Key[]
  states: Record<string, any>
}
