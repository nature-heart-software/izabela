import iohook from '@/modules/node-iohook'
import { Deferred } from '@/utils/promise'
import { flatten, uniq } from 'lodash'

const modifiersAliases = {
  shiftKey: 'shift',
  altKey: 'alt',
  ctrlKey: 'ctrl',
  metaKey: 'meta',
} as const

export const ElectronKeybind = () => ({
  getRecordingKeybinding() {
    console.log('hey')
    const { promise, resolve, reject } = Deferred()
    const events: any[] = []
    iohook.on('keypress', (event) => {
      console.log(event)
      events.push(event)
      if (events.length === 3) {
        resolve(events.map((e) => e.keycode))
      }
    });

    iohook.on('keyup', () => {
      resolve(events.map((e) => e.keycode))
    });
    return promise
  },
})

export default ElectronKeybind()
