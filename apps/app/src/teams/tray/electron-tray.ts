import { app, Menu, Tray, screen } from 'electron'
import path from 'path'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'

let tray = null
const createTray = (): Promise<Tray> =>
  app.whenReady().then(() => {
    tray = new Tray(path.join(__static, 'icons/256x256.png'))
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        submenu: [
          {
            label: 'Reset Display',
            click: () => {
              const primaryDisplay = screen.getPrimaryDisplay()
              electronMessengerWindow.setDisplay(primaryDisplay.id)
            }
          }
        ]
      },
      { type: 'separator' },
      { label: 'Exit', type: 'normal', role: 'quit' }
    ])
    tray.setToolTip(`${app.name} - v${app.getVersion()}`)
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      electronMessengerWindow.show()
    })
    return tray
  })

export default createTray
