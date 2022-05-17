import { app, Menu, Tray } from 'electron'
import path from 'path'
import { readFileSync } from 'fs'
import ElectronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'

let tray = null
const createTray = (): Promise<Tray> =>
  app.whenReady().then(() => {
    const rootPath = process.env.NODE_ENV === 'production' ? __static : path.resolve()
    const pkg = JSON.parse(readFileSync(path.join(rootPath, 'package.json'), 'utf8'))
    tray = new Tray(path.join(__static, 'icons/256x256.png'))
    const contextMenu = Menu.buildFromTemplate([{ label: 'Exit', type: 'normal', role: 'quit' }])
    tray.setToolTip(`${pkg.productName} - v${pkg.version}`)
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      ElectronMessengerWindow.show()
    })
    return tray
  })

export default createTray
