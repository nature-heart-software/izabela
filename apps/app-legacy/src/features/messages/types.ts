import { IzabelaMessage } from '@/modules/izabela/types'
import { Key } from '@/types/keybinds'

export type ShortcutMessage = IzabelaMessage & {
  id: string
  shortcut: Key[]
}
