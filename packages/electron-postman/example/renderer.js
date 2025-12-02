/* eslint-disable no-console */

window.ipc.handle('main', 'invoke-to-a', (msg, n) => n ** 2);

window.ipc.on('window-a', 'msg', (...args) => {
  console.log(`Receive message from window A: ${args}`);
});

window.ipc.handle('window-a', 'invoke', (n) => n ** 2);

window.ipc.on('window-b', 'msg', (...args) => {
  console.log(`Receive message from window B: ${args}`);
});

window.ipc.handle('window-b', 'invoke', (n) => n ** 3);

window.ipc.on('main', 'msg', (...args) => {
  console.log(`Receive message from main process: ${args}`);
});

window.ipc.handle('main', 'invoke', (n) => n ** 4);

function sendToWindow(windowName) {
  console.log(`Send message to window ${windowName}`);
  window.ipc.sendTo(windowName, 'msg', 'argument 1', 2, 3.0);
}

function invokeToWindow(windowName) {
  console.log(`Invoke message to window ${windowName}`);
  window.ipc.invokeTo(windowName, 'invoke', 2.5).then((result) => {
    console.log(`Invoke result: ${result}`);
  });
}

document.getElementById('btn-send-main').addEventListener('click', () => sendToWindow('main'));
document.getElementById('btn-send-a').addEventListener('click', () => sendToWindow('window-a'));
document.getElementById('btn-send-b').addEventListener('click', () => sendToWindow('window-b'));
document.getElementById('btn-invoke-main').addEventListener('click', () => invokeToWindow('main'));
document.getElementById('btn-invoke-a').addEventListener('click', () => invokeToWindow('window-a'));
document.getElementById('btn-invoke-b').addEventListener('click', () => invokeToWindow('window-b'));
