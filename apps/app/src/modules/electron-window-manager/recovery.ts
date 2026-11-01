import type { BrowserWindow } from 'electron'

// A renderer crash leaves the native window and main process alive. Reload the
// existing webContents so IPC registration and the single-instance lock survive.
export const recoverRenderer = (window: BrowserWindow) => {
  const attempts: number[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  window.webContents.on('render-process-gone', (_, details) => {
    if (details.reason === 'clean-exit' || details.reason === 'killed') return
    const now = Date.now()
    while (attempts.length && now - attempts[0] > 60000) attempts.shift()
    if (timer || attempts.length >= 3 || window.isDestroyed()) return
    attempts.push(now)
    timer = setTimeout(() => {
      timer = undefined
      if (!window.isDestroyed()) window.webContents.reload()
    }, 1000)
  })
  window.once('closed', () => clearTimeout(timer))
}
