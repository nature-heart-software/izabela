if (process.type === 'renderer') {
  module.exports.ipcRenderer = require('./src/ipcRenderer');
} else if (process.type === 'browser') {
  module.exports.ipcMain = require('./src/ipcMain');
} else {
  throw Error('grapes-ipc works only in Electron main and renderer process. Process type '
  + `${process.type} is not supported`);
}
