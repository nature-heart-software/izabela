import {
  getTopWindows,
  injectProcess,
  start,
  stop,
  setEventCallback,
  setHotkeys,
  sendCommand,
  addWindow,
  closeWindow,
  sendWindowBounds,
  sendFrameBuffer,
  translateInputEvent,
} from '..'
import type {
  IHotkey,
  IRectangle,
  IOverlayWindowDetails,
  IProcessThread,
  IWindow,
  IInjectResult,
  FpsPosition,
} from '..'

const rect: IRectangle = { x: -10, y: 20, width: 800, height: 600 }
const details: IOverlayWindowDetails = {
  name: 'overlay',
  transparent: true,
  resizable: false,
  maxWidth: 1920,
  maxHeight: 1080,
  minWidth: 10,
  minHeight: 10,
  rect,
  nativeHandle: 12,
}
const hotkey: IHotkey = {
  name: 'toggle',
  keyCode: 65,
  modifiers: { ctrl: true },
  passthrough: false,
}
const position: FpsPosition = 'TopRight'
const windows: IWindow[] = getTopWindows(true)
const process: IProcessThread = { processId: 1 }
const injection: IInjectResult = injectProcess({ processId: 1, windowId: 2 })
const result: void = start()
stop()
setHotkeys([hotkey])
setEventCallback((event, ...args) => {
  const name: string = event
  void [name, args]
})
sendCommand({ command: 'cursor', cursor: 'arrow' })
sendCommand({ command: 'fps', showfps: true, position })
sendCommand({ command: 'input.intercept', intercept: true })
addWindow(1, details)
closeWindow(1)
sendWindowBounds(1, { rect })
sendFrameBuffer(1, Buffer.alloc(4), 1, 1)
const input: unknown = translateInputEvent({
  windowId: 1,
  msg: 0,
  wparam: 0,
  lparam: 0,
})
// @ts-expect-error window identifier is required
injectProcess({ processId: 1 })
// @ts-expect-error rectangle dimensions must be numeric
sendWindowBounds(1, { rect: { x: 0, y: 0, width: '800', height: 600 } })
// @ts-expect-error the input intercept command requires its boolean field
sendCommand({ command: 'input.intercept' })
// @ts-expect-error unsupported FPS position
sendCommand({ command: 'fps', showfps: true, position: 'Center' })
// @ts-expect-error raw byte arrays are not Node buffers
sendFrameBuffer(1, new Uint8Array(4), 1, 1)
// @ts-expect-error invalid hotkey modifiers
setHotkeys([{ name: 'toggle', keyCode: 65, modifiers: { ctrl: 'yes' } }])
// @ts-expect-error translateInputEvent must not silently leak any
const typedInput: string = translateInputEvent({
  windowId: 1,
  msg: 0,
  wparam: 0,
  lparam: 0,
})
void [windows, process, injection, result, input]
