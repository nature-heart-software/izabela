import { bridge, isRenderer } from '@izabela/electron-bridger';
import Store from 'electron-store';
import { contextBridge, ipcRenderer, ipcMain } from 'electron';

class ElectronVuexStore {
  store: any = null;
  constructor() {
    this.store = isRenderer ? null : new Store({ name: 'vuex' });
  }
  ['set'](...args: any) {
    if (!this.store) return;
    return this.store.set(...args);
  }
  ['get'](...args: any) {
    if (!this.store) return;
    return this.store.get(...args);
  }
  ['delete'](...args: any) {
    if (!this.store) return;
    return this.store.delete(...args);
  }
}

if (isRenderer) {
  const IPC_EVENT_CONNECT = 'vuex-mutations-connect';
  const IPC_EVENT_NOTIFY_MAIN = 'vuex-mutations-notify-main';
  const IPC_EVENT_NOTIFY_RENDERERS = 'vuex-mutations-notify-renderers';

  contextBridge.exposeInMainWorld('ElectronVuex', {
    ipcRenderer: {
      ['SEND_IPC_EVENT_CONNECT'](payload: any) {
        ipcRenderer.send(IPC_EVENT_CONNECT, payload);
      },
      ['SEND_IPC_EVENT_NOTIFY_MAIN'](payload: any) {
        ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, payload);
      },
      ['ON_IPC_EVENT_NOTIFY_RENDERERS'](handler: any) {
        ipcRenderer.on(IPC_EVENT_NOTIFY_RENDERERS, handler);
      },
    },
  });
}

const { store } = bridge.new(ElectronVuexStore)();

if (!isRenderer) {
  Store.initRenderer();
  (global as any).ElectronVuexStore = store;
  (global as any).ipcMain = ipcMain;
}

declare global {
  interface Window {
    ElectronVuex: any;
    ElectronVuexStore: any;
  }
  interface Global {
    ipcMain: any;
    ElectronVuexStore: any;
  }
}
