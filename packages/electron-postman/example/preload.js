// eslint-disable-next-line import/no-unresolved
const { ipcRenderer } = require('electron-postman');

ipcRenderer.exposeInMainWorld('ipc');
