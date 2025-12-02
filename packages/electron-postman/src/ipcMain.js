const {
  ipcMain, webContents,
} = require('electron');
const {
  MAIN_PROCESS_ID, INTERNAL_CHANNELS, prefixed, throwError, getToken,
} = require('./utils');

const registeredWindows = new Map();

function broadcastWindowId(newWindowName, newWebContentsId) {
  registeredWindows.forEach((webContentsId) => {
    webContents.fromId(webContentsId).send(
      INTERNAL_CHANNELS.announceWindowId,
      newWindowName,
      newWebContentsId,
    );
  });
}

function unregisterWindow(windowName) {
  if (registeredWindows.has(windowName)) {
    registeredWindows.delete(windowName);
    broadcastWindowId(windowName, undefined);
  }
}

function registerBrowserWindow(windowName, browserWindow) {
  if (windowName === MAIN_PROCESS_ID) {
    throwError(`Window name '${MAIN_PROCESS_ID}' is reserved for main process`);
  }

  const webContentsId = browserWindow.webContents.id;

  if (
    registeredWindows.has(windowName)
    || Array.from(registeredWindows.values()).includes(webContentsId)
  ) {
    throwError(
      `Either window name '${windowName}' or window ID ${webContentsId} is already assigned `
      + 'to a browser window',
    );
  }

  browserWindow.on('closed', () => {
    unregisterWindow(windowName);
  });
  browserWindow.webContents.once('did-finish-load', () => {
    broadcastWindowId(windowName, webContentsId);
    registeredWindows.set(windowName, webContentsId);

    browserWindow.webContents.send(
      INTERNAL_CHANNELS.initRendererIpc, windowName, registeredWindows,
    );
  });
}

function sendTo(windowName, channel, ...args) {
  if (!registeredWindows.has(windowName)) {
    throwError(`Process '${windowName}' is not registered`);
  }

  webContents.fromId(registeredWindows.get(windowName)).send(
    prefixed(MAIN_PROCESS_ID, channel),
    ...args,
  );
}

function on(windowName, channel, callback) {
  if (typeof callback === 'function') {
    ipcMain.on(prefixed(windowName, channel), (event, ...args) => {
      callback(...args);
    });
  }
}

function once(windowName, channel, callback) {
  if (typeof callback === 'function') {
    ipcMain.once(prefixed(windowName, channel), (event, ...args) => {
      callback(...args);
    });
  }
}

function invokeTo(windowName, channel, ...args) {
  const token = getToken();
  return new Promise((resolve) => {
    ipcMain.once(prefixed(windowName, channel, token), (event, result) => {
      resolve(result);
    });
    sendTo(windowName, channel, token, ...args);
  });
}

function handle(windowName, channel, callback) {
  if (typeof callback === 'function') {
    ipcMain.handle(prefixed(windowName, channel), (event, ...args) => callback(...args));
  }
}

function handleOnce(windowName, channel, callback) {
  if (typeof callback === 'function') {
    ipcMain.handleOnce(prefixed(windowName, channel, (event, ...args) => callback(...args)));
  }
}

function removeAllListeners(windowName, channel) {
  ipcMain.removeAllListeners(prefixed(windowName, channel));
}

function removeHandler(windowName, channel) {
  ipcMain.removeHandler(prefixed(windowName, channel));
}

module.exports = {
  registerBrowserWindow,
  sendTo,
  on,
  once,
  invokeTo,
  handle,
  handleOnce,
  removeAllListeners,
  removeHandler,
};
