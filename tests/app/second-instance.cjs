const path = require('node:path')
const { app } = require('electron')
app.setName('Izabela App Regression Tests')
app.setPath('userData', process.argv[2])
const appRoot = process.argv[3]
app.on('before-quit', () => console.log('SECOND_INSTANCE_EXIT'))
require(path.join(appRoot, 'dist-electron/background.js'))
setTimeout(() => {
  console.error('Second instance did not exit')
  app.exit(2)
}, 8000).unref()
