import type { BrowserWindow } from 'electron'

/** Main-process API. Import only in Electron's browser process.
 * @example
 * ```ts
 * import { ipcMain } from 'electron-postman'
 * ipcMain.handle('settings', 'read', () => ({ enabled: true }))
 * ```
 */
export interface IpcMain {
  registerBrowserWindow(windowName: string, browserWindow: BrowserWindow): void
  sendTo(windowName: string, channel: string, ...args: unknown[]): void
  on<Args extends unknown[]>(
    windowName: string,
    channel: string,
    listener: (...args: Args) => void,
  ): void
  once<Args extends unknown[]>(
    windowName: string,
    channel: string,
    listener: (...args: Args) => void,
  ): void
  invokeTo<Result = unknown>(
    windowName: string,
    channel: string,
    ...args: unknown[]
  ): Promise<Result>
  handle<Args extends unknown[], Result>(
    windowName: string,
    channel: string,
    listener: (...args: Args) => Result,
  ): void
  /** The current runtime passes an invalid listener to Electron and throws. */
  handleOnce<Args extends unknown[], Result>(
    windowName: string,
    channel: string,
    listener: (...args: Args) => Result,
  ): void
  removeAllListeners(windowName: string, channel: string): void
  removeHandler(windowName: string, channel: string): void
}

/** Renderer/preload API. Renderer handlers currently require synchronous results.
 * @example
 * ```ts
 * import { ipcRenderer } from 'electron-postman'
 * ipcRenderer.handle('main', 'double', (value: number) => value * 2)
 * ```
 */
export interface IpcRenderer {
  exposeInMainWorld(apiKey?: string): void
  send(channel: string, ...args: unknown[]): void
  sendTo(processName: string, channel: string, ...args: unknown[]): void
  on<Args extends unknown[]>(
    processName: string,
    channel: string,
    listener: (...args: Args) => void,
  ): void
  once<Args extends unknown[]>(
    processName: string,
    channel: string,
    listener: (...args: Args) => void,
  ): void
  invoke<Result = unknown>(channel: string, ...args: unknown[]): Promise<Result>
  invokeTo<Result = unknown>(
    processName: string,
    channel: string,
    ...args: unknown[]
  ): Promise<Result>
  handle<Args extends unknown[], Result>(
    processName: string,
    channel: string,
    listener: (...args: Args) => Result,
  ): void
  handleOnce<Args extends unknown[], Result>(
    processName: string,
    channel: string,
    listener: (...args: Args) => Result,
  ): void
  removeAllListeners(processName: string, channel: string): void
}

/** Available only in Electron's browser process.
 * @example
 * ```ts
 * import { ipcMain } from 'electron-postman'
 * ipcMain.sendTo('settings', 'refresh')
 * ```
 */
export const ipcMain: IpcMain

/** Available only in Electron's renderer/preload process.
 * @example
 * ```ts
 * import { ipcRenderer } from 'electron-postman'
 * ipcRenderer.exposeInMainWorld('ipc')
 * ```
 */
export const ipcRenderer: IpcRenderer
