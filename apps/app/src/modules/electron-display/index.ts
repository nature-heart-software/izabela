import { screen } from 'electron'
import ElectronWindowManager from '@/modules/electron-window-manager'

export const ElectronDisplay = () => {
  return {
    getAllDisplays(): Electron.Display[] {
      return screen.getAllDisplays()
    },
    getPrimaryDisplay(): Electron.Display {
      return screen.getPrimaryDisplay()
    },
    setDisplay(id: Electron.Display['id']): void {
      const display = screen.getAllDisplays().find(d => d.id === id) || screen.getPrimaryDisplay()
      const window = ElectronWindowManager
        .getInstanceByName('messenger')
        ?.window
      if (window) {
        window.setBounds(display.bounds)
      }
    }
  }
}

export default ElectronDisplay()
