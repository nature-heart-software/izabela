import { app, Menu, screen, Tray } from 'electron'
import path from 'path'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

let tray: Tray
const createTray = (): Promise<Tray> =>
  app.whenReady().then(() => {
    const settingsStore = useSettingsStore()
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
                  settingsStore.display !== null
                    ? id === settingsStore.display
                    : primaryDisplay.id === id,
                click: () => {
                  settingsStore.$patch({ display: id })
                },
              })),
            },
            {
              label: 'Reset Display',
              click: () => {
                settingsStore.$patch({ display: null })
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
    updateContextMenu()
    watch(() => settingsStore.display, updateContextMenu)
    return tray
  })

export default createTray
