const CHANNEL_PREFIX = 'electron-postman';
// const INSTANCE_TOKEN = Math.floor(Math.random() * 1000000);// .padStart(7, '0');

const MAIN_PROCESS_ID = 'main';

function prefixed(processName, channel, token) {
  const tokenStr = token ? `${token}-` : '';
  return `${CHANNEL_PREFIX}-${tokenStr}${processName}-${channel}`;
}

const INTERNAL_CHANNELS = {
  announceWindowId: 'announce-window-id',
  initRendererIpc: 'init-renderer-ipc',
};

function throwError(msg) {
  throw Error(`electron-postman: ${msg}`);
}

function getToken() {
  return Math.floor(Math.random() * 1000000);// .padStart(7, '0');
}

module.exports.MAIN_PROCESS_ID = MAIN_PROCESS_ID;
module.exports.throwError = throwError;
module.exports.INTERNAL_CHANNELS = INTERNAL_CHANNELS;
module.exports.prefixed = prefixed;
module.exports.getToken = getToken;
