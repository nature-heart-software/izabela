import { mouse } from '@nut-tree-fork/nut-js'
import mitt from 'mitt'
import throttle from 'lodash/throttle'

const mouseEventEmitter = mitt()

let stop = true

export function startMouse(throttleMs: number = 0) {
  if (typeof window !== 'undefined') return null
  stop = false
  const check = throttle(
    () =>
      mouse.getPosition().then((mousePosition) => {
        if (stop) return
        mouseEventEmitter.emit('move', mousePosition)
        check()
      }),
    throttleMs,
  )
  check()
  return mouseEventEmitter
}

export function stopMouse() {
  stop = true
}
