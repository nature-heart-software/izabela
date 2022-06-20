import iohook, { modifiersEvents, IOHookKeyboardEvent } from '@/modules/node-iohook'
import { Deferred } from '@/utils/promise'

type KeybindingResult = {
  modifiers: typeof modifiersEvents[keyof typeof modifiersEvents]['name'][]
  keys: string[]
  combination: number[]
}

export const ElectronKeybind = () => ({
  getKeybinding() {
    const { promise, resolve, reject } = Deferred()
    const modifiers: { [key: string]: typeof modifiersEvents[keyof typeof modifiersEvents] } = {}
    const events: Record<string, IOHookKeyboardEvent> = {}
    const getResult = (): KeybindingResult => ({
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
        Object.entries(modifiersEvents) as [
          keyof typeof modifiersEvents,
          typeof modifiersEvents[keyof typeof modifiersEvents],
        ][]
      ).forEach(([modifier, { rawcode }]) => {
        if (event[modifier]) {
          modifiers[rawcode] = modifiersEvents[modifier]
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
})

export default ElectronKeybind()
