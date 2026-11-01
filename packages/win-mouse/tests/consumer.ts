import mouse = require('..')
import { EventEmitter } from 'node:events'

const options: mouse.Options = {
  debug: false,
  pumpMs: 10,
  maxMessagesPerTick: 20,
}
const tracker: mouse.Mouse = mouse(options)
const emitter: EventEmitter = tracker
tracker.on('move', (x, y) => {
  const coordinates: [number, number] = [x, y]
  void coordinates
})
tracker.once('middle-drag', (x, y) => {
  const n: number = x + y
  void n
})
tracker.on('*', (event, x, y) => {
  const kind: mouse.MouseEvent = event
  const n: number = x + y
  void [kind, n]
})
const listener = (x: number, y: number) => {
  void [x, y]
}
tracker.addListener('left-down', listener).removeListener('left-down', listener)
tracker.off('right-up', listener)
tracker.emit('move', 1, 2)
const destroyed: void = tracker.destroy()
const referenced: void = tracker.ref()
const unreferenced: void = tracker.unref()
// @ts-expect-error debugging requires a boolean
mouse({ debug: 'true' })
// @ts-expect-error polling interval requires a numeric option
mouse({ pumpMs: 'fast' })
// @ts-expect-error polling budget requires a number
mouse({ maxMessagesPerTick: false })
// @ts-expect-error coordinates are numbers, not strings
tracker.on('move', (x: string, y: string) => {})
// @ts-expect-error wildcard callback starts with the event name
tracker.on('*', (event: number) => {})
// @ts-expect-error emitted movement requires both coordinates
tracker.emit('move', 1)
// @ts-expect-error no input synthesis API is exported
tracker.click()
// @ts-expect-error this is an initializer, not a class
new mouse()
// @ts-expect-error no polling stop alias exists
tracker.stop()
void [emitter, destroyed, referenced, unreferenced]
