# Electon Postman :mailbox_with_mail:

Electron Postman is an easy-to-use wrapper around Electron's built-in IPC library.

Features:

- Similar IPC methods in main and renderer process
- Easy and direct window-to-window communication
- Integrates smoothly in `nodeIntegration` disabled and `contextIsolation` enabled
  BrowserWindows
- Allows `invoke` calls not only from renderer to main process, but also the other
  way around

## Example

You can register windows on creation. The window registration is broadcasted to
all other windows automatically.

```js
// main.js
ipcMain.registerBrowserWindow('window-a', windowA);
```

From now on, windows can communicate directly with each other.

```js
// windowB.js
ipcRenderer.sendTo('window-a', 'channel-name', args);
```

If you implement [Electron's security recommandations](https://www.electronjs.org/docs/tutorial/security)
and have disabled node integration and enabled context isolation for browser
windows, you can expose Electron Postman easily via a preload script.

```js
// preload.js
ipcRenderer.exposeInMainWorld('ipc');
```

```js
// windowA.js
window.ipc.invokeTo('window-b').then((result) => console.log(result));
```

## Installation

Yarn:

```sh
yarn add electron-postman
```

npm:

```sh
npm install electron-postman
```

## Usage

1. Register a window **before** its content is loaded.

  ```js
  // main.js
  const { ipcMain } = require('electron-postman');
  // ...
  const mainWindow = createMainWindow();
  ipcMain.registerBrowserWindow('main-window', mainWindow);
  mainWindow.loadFile(path);
  ```
  
2. (Optional) If using a preload script, expose the API to the renderer process.

  ```js
  // preload.js
  const { ipcRenderer } = require('electron-postman');
  ipcRenderer.exposeInMainWorld('ipc');
  ```

3. Send, invoke, handle and receive messages in main and in renderer processes.

## API

### `ipcMain`

#### `ipcMain.registerBrowserWindow(windowName, browserWindow)`

- `windowName` String
- `browserWindow` BrowserWindow
  
Registers the window and is made known with all other existing windows.
  
#### `ipcMain.sendTo(windowName, channel, ...args)`

- `windowName` String
- `channel` String
- `...args` any[]
  
Send an asynchronous message to the renderer process via `channel`, along with
arguments. Requires that `windowName` is a registered window. The renderer
process can handle the message by listening to `channel`.
  
#### `ipcMain.on(windowName, channel, listener)`

- `windowName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Listen to messages on `channel` from window `windowName`. Requires that
`windowName` is a registered window.

#### `ipcMain.once(windowName, channel, listener)`

- `windowName` String
- `channel` String
- `listener` Function
  - `...args` any[]

Same as `ipcMain.on`, but listener is removed once a message on `channel` was received.

#### `ipcMain.invokeTo(windowName, channel, ...args)`

- `windowName` String
- `channel` String
- `...args` any[]

Returns `Promise<any>` - Resolves with the response from the other process.

Send a message to `windowName` via `channel` and expect a result asynchronously.
The other process should listen for channel with `ipcMain.handle()` or
`ipcRenderer.handle()` respectively.

#### `ipcMain.handle(windowName, channel, listener)`

- `windowName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Adds a handler for an invokeable IPC. This handler will be called whenever a
renderer calls `ipcRenderer.invoke(channel, ...args)` or
`ipcRenderer.invokeTo('main', channel, ...args`.

If listener returns a Promise, the eventual result of the promise will be
returned as a reply to the remote caller. Otherwise, the return value of the
listener will be used as the value of the reply.

#### `ipcMain.handleOnce(windowName, channel, listener)`

- `windowName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Same as `ipcMain.handle`, but handler is removed once an invoke call was handled.

#### `ipcMain.removeAllListeners(windowName, channel)`

- `windowName` String
- `channel` String

Removes all listeners registered on `windowName` and `channel`.
  
#### `ipcMain.removeHandler(windowName, channel)`

- `windowName` String
- `channel` String

Removes handler, registered on `windowame` and `channel`.

### `ipcRenderer`

Each process is addressed with its process name (`processName`). For a renderer
process, its process name is the registered window name (renderer-to-renderer
communication), the main process has the process name `'main'` (renderer-to-main
communication).

#### `ipcRenderer.exposeInMainWorld(apiKey)`

- `apiKey` String

Exposes the IPC renderer API to context isolated renderer process. Works only,
if `contextIsolation` is enabled for that window. Uses Electron's
`contextBridge` API.

#### `ipcRenderer.send(channel, ...args)`

- `channel` String
- `...args` any[]
  
Equivalent to `ipcRenderer.sendTo('main', channel, ...args)`.

#### `ipcRenderer.sendTo(processName, channel, ...args)`

- `processName` String
- `channel` String
- `...args` any[]
  
Send an asynchronous message to the process registered as `processName` via
`channel`, along with arguments. The receiving process can handle the message by
listening to `channel`.

#### `ipcRenderer.on(processName, channel, listener)`

- `processName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Listen to messages on `channel` from process `processName`.

#### `ipcRenderer.once(processName, channel, listener)`

- `processName` String
- `channel` String
- `listener` Function
  - `...args` any[]

Same as `ipcMain.on`, but listener is removed once a message on `channel` was received.

#### `ipcRenderer.invoke(channel, ...args)`

- `processName` String
- `channel` String
- `...args` any[]

Equivalent to `ipcRenderer.invokeTo('main', channel, ...args)`.

#### `ipcRenderer.invokeTo(processName, channel, ...args)`

- `processName` String
- `channel` String
- `...args` any[]

Returns `Promise<any>` - Resolves with the response from the other process.

Send a message to `windowName` via `channel` and expect a result asynchronously.
The other process should listen for channel with `ipcMain.handle()` or
`ipcRenderer.handle()` respectively.

#### `ipcRenderer.handle(processName, channel, listener)`

- `processName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Adds a handler for an invokeable IPC. This handler will be called whenever a process
calls `.invoke('this-window-name', channel, ...args)`.

If listener returns a Promise, the eventual result of the promise will be returned
as a reply to the remote caller. Otherwise, the return value of the listener will
be used as the value of the reply.

#### `ipcRenderer.handleOnce(processName, channel, listener)`

- `processName` String
- `channel` String
- `listener` Function
  - `...args` any[]
  
Same as `ipcRenderer.handle`, but handler is removed once an invoke call was handled.

#### `ipcRenderer.removeAllListeners(processName, channel)`

- `processName` String
- `channel` String

Removes all listeners registered on `processName` and `channel`.
  
#### `ipcRenderer.removeHandler(processName, channel)`

- `processName` String
- `channel` String

Removes handler, registered on `processName` and `channel`.
