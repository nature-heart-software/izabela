import type { Buffer } from 'node:buffer'

/**
 * A named native keyboard shortcut.
 * @example
 * ```ts
 * const hotkey: IHotkey = { name: 'toggle', keyCode: 65, modifiers: { ctrl: true } }
 * ```
 */
export interface IHotkey {
  name: string
  keyCode: number
  modifiers?: { alt?: boolean; ctrl?: boolean; shift?: boolean; meta?: boolean }
  passthrough?: boolean
}

/**
 * Overlay bounds in pixels.
 * @example
 * ```ts
 * const rect: IRectangle = { x: 0, y: 0, width: 800, height: 600 }
 * ```
 */
export interface IRectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Native overlay window configuration.
 * @example
 * ```ts
 * const details: IOverlayWindowDetails = {
 *   name: 'overlay', transparent: true, resizable: false,
 *   maxWidth: 1920, maxHeight: 1080, minWidth: 1, minHeight: 1,
 *   rect: { x: 0, y: 0, width: 800, height: 600 }, nativeHandle: 12,
 * }
 * ```
 */
export interface IOverlayWindowDetails {
  name: string
  transparent: boolean
  resizable: boolean
  maxWidth: number
  maxHeight: number
  minWidth: number
  minHeight: number
  rect: IRectangle
  nativeHandle: number
  dragBorderWidth?: number
  caption?: { left: number; right: number; top: number; height: number }
}

/**
 * Supported native FPS display positions; this is a type, not a runtime enum.
 * @example
 * ```ts
 * const position: FpsPosition = 'TopLeft'
 * ```
 */
export type FpsPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight'

/**
 * A native process and optional thread identifier.
 * @example
 * ```ts
 * const process: IProcessThread = { processId: 123 }
 * ```
 */
export interface IProcessThread {
  processId: number
  threadId?: number
}

/**
 * An enumerated native window and its owning process.
 * @example
 * ```ts
 * const window: IWindow = { processId: 123, windowId: 456 }
 * ```
 */
export interface IWindow extends IProcessThread {
  windowId: number
  title?: string
}

/**
 * Native injection result and the helper paths used.
 * @example
 * ```ts
 * const result: IInjectResult = injectProcess({ processId: 123, windowId: 456 })
 * ```
 */
export interface IInjectResult {
  injectHelper: string
  injectDll: string
  injectSucceed: boolean
}

/**
 * Enumerates native top-level windows.
 * @param includeMinimized - Whether minimized windows are included.
 * @returns Native window descriptors.
 * @example
 * ```ts
 * const windows = getTopWindows(true)
 * ```
 */
export declare function getTopWindows(includeMinimized?: boolean): IWindow[]

/**
 * Injects the native overlay into a window's process.
 * @param process - Target process and window identifiers.
 * @returns Injection status and helper paths.
 * @example
 * ```ts
 * const result = injectProcess({ processId: 123, windowId: 456 })
 * ```
 */
export declare function injectProcess(process: IWindow): IInjectResult

/**
 * Starts native overlay communication.
 * @example
 * ```ts
 * start()
 * ```
 */
export declare function start(): void

/**
 * Stops native overlay communication.
 * @example
 * ```ts
 * stop()
 * ```
 */
export declare function stop(): void

/**
 * Receives native events and their event-specific payloads.
 * @param cb - Callback invoked by the native addon.
 * @example
 * ```ts
 * setEventCallback((event, ...args) => console.log(event, args))
 * ```
 */
export declare function setEventCallback(
  cb: (event: string, ...args: any[]) => void,
): void

/**
 * Configures native keyboard shortcuts.
 * @param hotkeys - Shortcuts to register.
 * @example
 * ```ts
 * setHotkeys([{ name: 'toggle', keyCode: 65 }])
 * ```
 */
export declare function setHotkeys(hotkeys: IHotkey[]): void

/**
 * Sends a cursor, FPS display or input-interception command.
 * @param arg - The command and its required payload.
 * @example
 * ```ts
 * sendCommand({ command: 'input.intercept', intercept: true })
 * ```
 */
export declare function sendCommand(
  arg:
    | { command: 'cursor'; cursor: string }
    | { command: 'fps'; showfps: boolean; position: FpsPosition }
    | { command: 'input.intercept'; intercept: boolean },
): void

/**
 * Registers a native overlay window.
 * @param windowId - Window identifier.
 * @param details - Bounds, native handle and window flags.
 * @example
 * ```ts
 * addWindow(1, { name: 'overlay', transparent: true, resizable: false,
 *   maxWidth: 800, maxHeight: 600, minWidth: 1, minHeight: 1,
 *   rect: { x: 0, y: 0, width: 800, height: 600 }, nativeHandle: 12 })
 * ```
 */
export declare function addWindow(
  windowId: number,
  details: IOverlayWindowDetails,
): void

/**
 * Removes a native overlay window.
 * @param windowId - Window identifier.
 * @example
 * ```ts
 * closeWindow(1)
 * ```
 */
export declare function closeWindow(windowId: number): void

/**
 * Updates an overlay window's bounds.
 * @param windowId - Window identifier.
 * @param details - New pixel bounds.
 * @example
 * ```ts
 * sendWindowBounds(1, { rect: { x: 0, y: 0, width: 800, height: 600 } })
 * ```
 */
export declare function sendWindowBounds(
  windowId: number,
  details: { rect: IRectangle },
): void

/**
 * Sends an overlay frame's pixels to the native addon.
 * @param windowId - Window identifier.
 * @param buffer - Pixel buffer.
 * @param width - Frame width in pixels.
 * @param height - Frame height in pixels.
 * @example
 * ```ts
 * sendFrameBuffer(1, Buffer.alloc(4), 1, 1)
 * ```
 */
export declare function sendFrameBuffer(
  windowId: number,
  buffer: Buffer,
  width: number,
  height: number,
): void

/**
 * Translates a native input message; consumers must narrow the event-specific result.
 * @param event - Native window message fields.
 * @returns An input-event payload determined by the message.
 * @example
 * ```ts
 * const translated: unknown = translateInputEvent({ windowId: 1, msg: 0, wparam: 0, lparam: 0 })
 * ```
 */
export declare function translateInputEvent(event: {
  windowId: number
  msg: number
  wparam: number
  lparam: number
}): unknown
