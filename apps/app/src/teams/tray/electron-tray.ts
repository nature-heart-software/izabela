import { app, Menu, Tray, screen } from 'electron'
import path from 'path'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import store from '@/store'
import { watch } from 'vue'

let tray: Tray
const createTray = (): Promise<Tray> =>
  app.whenReady().then(() => {
    tray = new Tray(path.join(__static, 'icons/256x256.png'))
    const getContextMenu = () => {
      const primaryDisplay = screen.getPrimaryDisplay()
      const allDisplays = screen.getAllDisplays()
      return Menu.buildFromTemplate([
        {
          label: 'Settings',
          submenu: [
            {
              label: 'Display',
              submenu: allDisplays.map(({ id }) => ({
                label: `${(id === primaryDisplay.id && '(Primary) ') || ''}${id}`,
                type: 'radio',
                checked:
                  store.getters['settings/persisted'].display !== null
                    ? id === store.getters['settings/persisted'].display
                    : primaryDisplay.id === id,
                click: () => {
                  store.dispatch('settings/setProperty', ['persisted.display', id])
                },
              })),
            },
            {
              label: 'Reset Display',
              click: () => {
                store.dispatch('settings/setProperty', ['persisted.display', null])
              },
            },
          ],
        },
        { type: 'separator' },
        { label: 'Exit', type: 'normal', role: 'quit' },
      ])
    }
    function updateContextMenu() {
      tray.setContextMenu(getContextMenu())
    }
    tray.setToolTip(`${app.name} - v${app.getVersion()}`)
    tray.setContextMenu(getContextMenu())
    tray.on('click', electronMessengerWindow.show)
    store.getters.isReady().then(updateContextMenu)
    watch(() => store.getters['settings/persisted'].display, updateContextMenu)
    return tray
  })

export default createTray
