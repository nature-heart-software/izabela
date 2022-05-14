import store from '@/store'
import { app } from 'electron'

app.setLoginItemSettings({
  openAtLogin: store.getters['settings/persisted'].launchOnStartup,
  path: app.getPath('exe'),
})
