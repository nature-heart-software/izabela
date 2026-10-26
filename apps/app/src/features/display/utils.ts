import type Electron from 'electron'

export const boundsMatch = (a: Electron.Rectangle, b: Electron.Rectangle) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/** Match saved bounds before considering an ID that may have been reassigned. */
export const findDisplay = (
  displays: Electron.Display[],
  id?: Electron.Display['id'] | null,
  boundsHint?: Electron.Rectangle | null,
) => {
  if (boundsHint) {
    const display = displays.find((d) => boundsMatch(d.bounds, boundsHint))
    if (display) return display
  }
  return id == null ? undefined : displays.find((d) => d.id === id)
}
