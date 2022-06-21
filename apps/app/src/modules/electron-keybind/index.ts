import iohook, { modifierEvents, IOHookKeyboardEvent } from '@/modules/node-iohook'
import { Deferred } from '@/utils/promise'
import { Keybind } from '@/types/node'

type ModifierEvents = typeof modifierEvents

export const ElectronKeybind = () => ({
  getKeybind() {
    const { promise, resolve, reject } = Deferred<Keybind>()
    const modifiers: { [key: string]: ModifierEvents[keyof ModifierEvents] } = {}
    const events: Record<string, IOHookKeyboardEvent> = {}
    const getResult = (): Keybind => ({
      keys: Object.values(events).map((v) => (v.keychar && String.fromCharCode(v.keychar)) || ''),
      modifiers: Object.values(modifiers).map((v) => v.name),
      combination: [...Object.values(modifiers), ...Object.values(events)].map((v) => v.rawcode),
    })
    const removeListeners = () => {
      iohook.off('keypress', onKeyPress)
      iohook.off('keyup', onKeyUp)
    }
    const rejectPromise = () => {
      reject()
      removeListeners()
    }
    const resolvePromise = () => {
      resolve(getResult())
      removeListeners()
    }
    function onKeyPress(event: IOHookKeyboardEvent) {
      if (event.keycode === 27) {
        rejectPromise()
        return
      }
      ;(
        Object.entries(modifierEvents) as [
          keyof ModifierEvents,
          ModifierEvents[keyof ModifierEvents],
        ][]
      ).forEach(([modifier, { rawcode }]) => {
        if (event[modifier]) {
          modifiers[rawcode] = modifierEvents[modifier]
        }
      })
      events[event.rawcode] = event
      const allEvents = [...Object.values(modifiers), ...Object.values(events)]
      if (Object.keys(allEvents).length === 3) {
        resolvePromise()
      }
    }
    function onKeyUp() {
      resolvePromise()
    }

    iohook.on('keypress', onKeyPress)
    iohook.on('keyup', onKeyUp)
    return promise
  },
  setAudioRecordKeybind(keybind: Keybind) {
    console.log(keybind)
    return Promise.resolve(true)
  },
})

export default ElectronKeybind()
