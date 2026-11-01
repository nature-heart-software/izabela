import { screen } from 'electron'

export const ElectronDisplay = () => ({
  getAllDisplays(): Electron.Display[] {
    return screen.getAllDisplays()
  },
  getPrimaryDisplay(): Electron.Display {
    return screen.getPrimaryDisplay()
  },
})

export default ElectronDisplay()
