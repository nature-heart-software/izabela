import { ipcMain, ipcRenderer, type IpcMain, type IpcRenderer } from '..'
import type { BrowserWindow } from 'electron'

declare const window: BrowserWindow
const main: IpcMain = ipcMain
const renderer: IpcRenderer = ipcRenderer
main.registerBrowserWindow('settings', window)
main.on('settings', 'value', (value: number, name: string) => {
  void [value, name]
})
main.once('settings', 'done', () => {})
main.handle('settings', 'read', async (key: string) => ({ key }))
main.handleOnce('settings', 'read-once', () => 1)
main.sendTo('settings', 'state', { count: 1 }, null)
const result: Promise<number> = main.invokeTo<number>('settings', 'count')
main.removeHandler('settings', 'read')
main.removeAllListeners('settings', 'done')
renderer.exposeInMainWorld()
renderer.exposeInMainWorld('ipc')
renderer.on('main', 'read', (value: number) => {
  void value
})
renderer.once('peer', 'done', () => {})
renderer.handle('main', 'double', (value: number) => value * 2)
renderer.handleOnce('main', 'once', () => 'ok')
renderer.send('main-event', undefined)
renderer.sendTo('peer', 'event', [1, 2])
renderer.removeAllListeners('main', 'read')
const direct: Promise<string> = renderer.invoke<string>('read', 'key')
const peer: Promise<boolean> = renderer.invokeTo<boolean>('peer', 'ready')
const untypedResult = renderer.invoke('unknown')
// @ts-expect-error no response schema is inferred without an explicit result type
const unknownResult: Promise<string> = untypedResult
// @ts-expect-error window names must be strings
main.sendTo(1, 'event')
// @ts-expect-error BrowserWindow is required for registration
main.registerBrowserWindow('bad', {})
// @ts-expect-error listener must be callable
main.on('settings', 'read', 'wrong')
// @ts-expect-error main handlers are callable
main.handle('settings', 'read', false)
// @ts-expect-error channel is required
renderer.invoke()
// @ts-expect-error native event listeners are not exposed
renderer.removeListener('main', 'read', () => {})
// @ts-expect-error renderer removeHandler is documented upstream but absent at runtime
renderer.removeHandler('main', 'read')
// @ts-expect-error exposure key must be a string
renderer.exposeInMainWorld(2)
void [result, direct, peer, unknownResult]
