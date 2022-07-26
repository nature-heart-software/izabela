import iohook, { modifiersEvents, IOHookKeyboardEvent } from '@/modules/node-iohook'
import { Deferred } from '@/utils/promise'
import { KeybindingResult } from '@/types/keybinds'

export const ElectronKeybinding = () => ({
  getKeys() {
    const { promise, resolve, reject } = Deferred<KeybindingResult>()
    const modifiers: { [key: string]: typeof modifiersEvents[keyof typeof modifiersEvents] } = {}
    const events: Record<string, IOHookKeyboardEvent> = {}
    const getResult = (): KeybindingResult => ({
      keys: Object.values(events).map((v) => (v.keychar && String.fromCharCode(v.keychar)) || ''),
      modifiers: Object.values(modifiers).map((v) => v.name),
      combination: [...Object.values(modifiers), ...Object.values(events)].map((v) => v.keycode),
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
      ).forEach(([modifier, { keycode }]) => {
        if (event[modifier]) {
          modifiers[keycode] = modifiersEvents[modifier]
        }
      })
      events[event.keycode] = event
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
  getKey() {
    const { promise, resolve, reject } = Deferred<KeybindingResult>()
    const modifiers: { [key: string]: typeof modifiersEvents[keyof typeof modifiersEvents] } = {}
    const events: Record<string, IOHookKeyboardEvent> = {}
    const getResult = (): KeybindingResult => ({
      keys: Object.values(events).map(
        (v) => (v.keychar && String.fromCharCode(v.keychar)) || v.keycode.toString(),
      ),
      modifiers: Object.values(modifiers).map((v) => v.name),
      combination: [...Object.values(modifiers), ...Object.values(events)].map((v) => v.keycode),
    })
    const removeListeners = () => {
      iohook.off('keydown', onKeyDown)
    }
    const rejectPromise = () => {
      reject()
      removeListeners()
    }
    const resolvePromise = () => {
      resolve(getResult())
      removeListeners()
    }
    function onKeyDown(event: IOHookKeyboardEvent) {
      if (event.keycode === 27) {
        rejectPromise()
        return
      }
      events[event.keycode] = event
      resolvePromise()
    }

    iohook.on('keydown', onKeyDown)
    return promise
  },
})

export default ElectronKeybinding()
