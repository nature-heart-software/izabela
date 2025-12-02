// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcRenderer } = require('electron');
const {
  INTERNAL_CHANNELS, MAIN_PROCESS_ID, prefixed, throwError, getToken,
} = require('./utils');

let processes = new Map();
processes.set(MAIN_PROCESS_ID, 0);
let windowName;

(function listenToWindowAnnouncements() {
  ipcRenderer.on(INTERNAL_CHANNELS.announceWindowId, (event, name, id) => {
    if (id === undefined) {
      processes.delete(name);
    } else {
      processes.set(name, id);
    }
  });
}());

(function initializeRendererIpc() {
  ipcRenderer.once(INTERNAL_CHANNELS.initRendererIpc, (event, name, windows) => {
    windowName = name;
    processes = new Map([...processes, ...windows]);
  });
}());

function send(channel, ...args) {
  ipcRenderer.send(prefixed(windowName, channel), ...args);
}

function sendTo(processName, channel, ...args) {
  if (!processes.has(processName)) {
    throwError(`Process '${processName}' is not registered`);
  }

  if (processName === MAIN_PROCESS_ID) {
    send(channel, ...args);
  } else {
    ipcRenderer.sendTo(processes.get(processName), prefixed(windowName, channel), ...args);
  }
}

function on(processName, channel, callback) {
  if (typeof callback === 'function') {
    ipcRenderer.on(prefixed(processName, channel), (event, ...args) => {
      callback(...args);
    });
  }
}

function once(processName, channel, callback) {
  if (typeof callback === 'function') {
    ipcRenderer.once(prefixed(processName, channel), (event, ...args) => {
      callback(...args);
    });
  }
}

function invoke(channel, ...args) {
  return ipcRenderer.invoke(prefixed(windowName, channel), ...args);
}

function invokeTo(processName, channel, ...args) {
  if (processName === MAIN_PROCESS_ID) {
    return invoke(channel, ...args);
  }

  const token = getToken();
  return new Promise((resolve) => {
    ipcRenderer.once(prefixed(processName, channel, token), (event, result) => {
      resolve(result);
    });
    sendTo(processName, channel, token, ...args);
  });
}

function handle(processName, channel, callback) {
  if (typeof callback === 'function') {
    ipcRenderer.on(prefixed(processName, channel), (event, token, ...args) => {
      const result = callback(...args);
      const prefixedChannel = prefixed(windowName, channel, token);
      if (event.senderId === 0) {
        ipcRenderer.send(prefixedChannel, result);
      } else {
        ipcRenderer.sendTo(event.senderId, prefixedChannel, result);
      }
    });
  }
}

function handleOnce(processName, channel, callback) {
  if (typeof callback === 'function') {
    ipcRenderer.once(prefixed(processName, channel), (event, token, ...args) => {
      const result = callback(...args);
      const prefixedChannel = prefixed(windowName, channel, token);
      if (event.senderId === 0) {
        ipcRenderer.send(prefixedChannel, result);
      } else {
        ipcRenderer.sendTo(event.senderId, prefixedChannel, result);
      }
    });
  }
}

function removeAllListeners(processName, channel) {
  ipcRenderer.removeAllListeners(prefixed(processName, channel));
}

const ipc = {
  sendTo,
  send,
  on,
  once,
  invokeTo,
  invoke,
  handle,
  handleOnce,
  removeAllListeners,
};

function exposeInMainWorld(apiKey) {
  const { contextBridge } = require('electron');
  contextBridge.exposeInMainWorld(apiKey || 'ipcRenderer', ipc);
}

module.exports = {
  exposeInMainWorld,
  ...ipc,
};
