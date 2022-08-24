import { screen } from 'electron'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'

export const ElectronDisplay = () => {
  return {
    getAllDisplays(): Electron.Display[] {
      return screen.getAllDisplays()
    },
    getPrimaryDisplay(): Electron.Display {
      return screen.getPrimaryDisplay()
    },
    setDisplay(id: Electron.Display['id']): void {
      electronMessengerWindow.setDisplay(id)
    },
  }
}

export default ElectronDisplay()
