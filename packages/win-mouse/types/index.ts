import { EventEmitter } from 'node:events'

/** Creates a lazy raw-input EventEmitter. Adding its first listener starts tracking.
 * @param options - Per-instance debugging and polling limits.
 * @returns A tracker; destroy it to stop its polling timer. ref/unref are no-ops.
 * @example
 * ```ts
 * import mouse = require('@packages/win-mouse')
 * const tracker = mouse({ pumpMs: 6, maxMessagesPerTick: 60 })
 * tracker.on('move', (x, y) => console.log(x, y))
 * tracker.destroy()
 * ```
 */
declare function init(options?: init.Options): init.Mouse

declare namespace init {
  /** Polling configuration. Values are converted to numbers and clamped to at least 1.
   * @example
   * ```ts
   * import mouse = require('@packages/win-mouse')
   * const options: mouse.Options = { debug: false, pumpMs: 10 }
   * ```
   */
  interface Options {
    debug?: boolean
    pumpMs?: number
    maxMessagesPerTick?: number
  }
  /** Event names emitted by the raw-input callback; wheel/click synthesis is not provided.
   * @example
   * ```ts
   * import mouse = require('@packages/win-mouse')
   * const event: mouse.MouseEvent = 'middle-drag'
   * ```
   */
  type MouseEvent =
    | 'move'
    | 'left-down'
    | 'left-up'
    | 'left-drag'
    | 'right-down'
    | 'right-up'
    | 'right-drag'
    | 'middle-down'
    | 'middle-up'
    | 'middle-drag'
  /** Event payload tuples used by the native tracker.
   * @example
   * ```ts
   * import mouse = require('@packages/win-mouse')
   * const position: mouse.Events['move'] = [10, 20]
   * ```
   */
  type Events = { [K in MouseEvent]: [x: number, y: number] } & {
    '*': [event: MouseEvent, x: number, y: number]
    newListener: [event: string | symbol, listener: (...args: any[]) => void]
    removeListener: [event: string | symbol, listener: (...args: any[]) => void]
    error: [error: Error]
  }
  /** An EventEmitter with native tracking lifecycle methods.
   * @example
   * ```ts
   * import mouse = require('@packages/win-mouse')
   * const tracker: mouse.Mouse = mouse()
   * tracker.on('*', (event, x, y) => console.log(event, x, y))
   * tracker.destroy()
   * ```
   */
  interface Mouse extends EventEmitter<Events> {
    /** No-op in the Koffi implementation. @returns Nothing. */
    ref(): void
    /** No-op; does not release the polling timer. @returns Nothing. */
    unref(): void
    /** Clears the timer and destroys the window when present. @returns Nothing. */
    destroy(): void
  }
}

export = init
