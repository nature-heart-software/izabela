import {MutationPayload, Store, ActionPayload} from 'vuex'
import {IpcRendererHandler} from '@/modules/electron-vuex/types'
import * as global from 'global'
import IpcMain = Electron.IpcMain
import IpcMainEvent = Electron.IpcMainEvent

const IPC_EVENT_CONNECT = 'vuex-mutations-connect'
const IPC_EVENT_NOTIFY_MAIN = 'vuex-mutations-notify-main'
const IPC_EVENT_NOTIFY_RENDERERS = 'vuex-mutations-notify-renderers'
type Options = {
  type?: 'renderer' | 'main'
  ipcMain?: Electron.IpcMain
  ipcRenderer?: {
    SEND_IPC_EVENT_CONNECT: () => void,
    ON_IPC_EVENT_NOTIFY_RENDERERS: (handler: IpcRendererHandler) => void
    SEND_IPC_EVENT_NOTIFY_MAIN: (payload: MutationPayload) => void
  }
}
type StoreOption = Store<unknown> & {
  originalCommit: Store<unknown>['commit']
  originalDispatch: Store<unknown>['dispatch']
  dispatch: (type: string, payload: ActionPayload) => void
}
type Connections = { [key: string]: IpcMainEvent['sender'] }
class SharedMutations {
  options!: Options
  store: StoreOption
  constructor(store: StoreOption) {
    this.store = store
  }

  loadOptions() {
    if (!this.options.type) {
      this.options.type = typeof window !== 'undefined' ? 'renderer' : 'main'
    }
    if (!this.options.ipcMain) {
      this.options.ipcMain = (global as global & {ipcMain: IpcMain}).ipcMain
    }
    if (!this.options.ipcRenderer) {
      this.options.ipcRenderer =
        typeof window !== 'undefined' ? window.ElectronVuex.ipcRenderer : null
    }
  }

  connect() {
    this.options.ipcRenderer!.SEND_IPC_EVENT_CONNECT()
  }

  onConnect(handler: (e: IpcMainEvent) => void) {
    this.options.ipcMain!.on(IPC_EVENT_CONNECT, handler)
  }

  notifyMain(payload: MutationPayload) {
    this.options.ipcRenderer!.SEND_IPC_EVENT_NOTIFY_MAIN(payload)
  }

  onNotifyMain(handler: (e: IpcMainEvent, payload: MutationPayload) => void) {
    this.options.ipcMain!.on(IPC_EVENT_NOTIFY_MAIN, handler)
  }

  notifyRenderers(connections: Connections, payload: MutationPayload) {
    Object.keys(connections).forEach((processId) => {
      connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, payload)
    })
  }

  onNotifyRenderers(handler: IpcRendererHandler) {
    this.options.ipcRenderer!.ON_IPC_EVENT_NOTIFY_RENDERERS(handler)
  }

  rendererProcessLogic() {
    // Connect renderer to main process
    this.connect()

    // Save original Vuex methods
    this.store.originalCommit = this.store.commit
    this.store.originalDispatch = this.store.dispatch

    // Don't use commit in renderer outside of actions
    this.store.commit = () => {
      throw new Error(
        "[Vuex Electron] Please, don't use direct commit's, use dispatch instead of this.",
      )
    }

    // Forward dispatch to main process
    (this.store as any).dispatch = (type: string, payload: unknown) => {
      this.notifyMain({ type, payload })
    }

    // Subscribe on changes from main process and apply them
    this.onNotifyRenderers((event, { type, payload }) => {
      this.store.originalCommit(type, payload)
    })
  }

  mainProcessLogic() {
    const connections: Connections = {}

    // Save new connection
    this.onConnect((event) => {
      const win = event.sender
      const winId = win.id

      connections[winId] = win

      // Remove connection when window is closed
      win.on('destroyed', () => {
        delete connections[winId]
      })
    })

    // Subscribe on changes from renderer processes
    this.onNotifyMain((event, { type, payload }) => {
      this.store.dispatch(type, payload)
    })

    // Subscribe on changes from Vuex store
    this.store.subscribe((mutation: MutationPayload) => {
      const { type, payload } = mutation

      // Forward changes to renderer processes
      this.notifyRenderers(connections, { type, payload })
    })
  }

  activatePlugin() {
    switch (this.options.type) {
      case 'renderer':
        this.rendererProcessLogic()
        break
      case 'main':
        this.mainProcessLogic()
        break
      default:
        throw new Error('[Vuex Electron] Type should be "renderer" or "main".')
    }
  }
}

export default () =>
  (store: StoreOption) => {
    const sharedMutations = new SharedMutations(store)

    sharedMutations.loadOptions()
    sharedMutations.activatePlugin()
  }
