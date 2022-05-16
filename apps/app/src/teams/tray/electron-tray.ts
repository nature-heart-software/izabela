import { app, Menu, Tray } from 'electron'
import path from 'path'
import ElectronMessengerWindow from '@/entities/messenger/modules/electron-messenger-window'
import pkg from '@package'

let tray = null
const createTray = (): Promise<Tray> =>
  app.whenReady().then(() => {
    tray = new Tray(path.join(__static, 'icons/256x256.png'))
    const contextMenu = Menu.buildFromTemplate([{ label: 'Exit', type: 'normal', role: 'quit' }])
    tray.setToolTip(`${ pkg.productName } - v${ pkg.version }`)
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      ElectronMessengerWindow.show()
    })
    return tray
  })

export default createTray
