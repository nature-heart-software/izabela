import {
  MutationPayload, Store, Plugin, Dispatch, Commit,
} from 'vuex'
import {
  AugmentedGlobal,
  IpcRenderer,
  ProcessType,
  IpcMainMutationEventHandler,
  Connections,
  IpcRendererMutationEventHandler,
} from '@/modules/electron-vuex/types'
import { IPC_EVENT_CONNECT, IPC_EVENT_NOTIFY_MAIN, IPC_EVENT_NOTIFY_RENDERERS } from './consts'

class SharedMutations {
  type: ProcessType = typeof window !== 'undefined' ? 'renderer' : 'main'
  ipcMain: Electron.IpcMain = (global as AugmentedGlobal).ipcMain
  ipcRenderer: IpcRenderer | null =
    typeof window !== 'undefined' ? window.ElectronVuex.ipcRenderer : null
  store: Store<unknown>
  storeOriginalCommit!: Commit
  storeOriginalDispatch!: Dispatch

  constructor(store: Store<unknown>) {
    this.store = store
  }

  connect() {
    if (this.ipcRenderer) this.ipcRenderer.SEND_IPC_EVENT_CONNECT()
  }

  onConnect(handler: IpcMainMutationEventHandler) {
    this.ipcMain.on(IPC_EVENT_CONNECT, handler)
  }

  notifyMain(payload: MutationPayload) {
    if (this.ipcRenderer) this.ipcRenderer.SEND_IPC_EVENT_NOTIFY_MAIN(payload)
  }

  onNotifyMain(handler: IpcMainMutationEventHandler) {
    this.ipcMain.on(IPC_EVENT_NOTIFY_MAIN, handler)
  }

  notifyRenderers(connections: Connections, payload: MutationPayload, sourceProcessId = '') {
    Object.keys(connections).forEach((processId) => {
      if (processId !== sourceProcessId) {
        connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, payload)
      }
    })
  }

  onNotifyRenderers(handler: IpcRendererMutationEventHandler) {
    if (this.ipcRenderer) this.ipcRenderer.ON_IPC_EVENT_NOTIFY_RENDERERS(handler)
  }

  rendererProcessLogic() {
    // Connect renderer to main process
    this.connect()

    // Save original Vuex methods
    this.storeOriginalCommit = this.store.commit
    this.storeOriginalDispatch = this.store.dispatch

    // Don't use commit in renderer outside of actions
    this.store.commit = () => {
      throw new Error(
        "[Vuex Electron] Please, don't use direct commit's, use dispatch instead of this.",
      )
    }

    // Forward dispatch to main process
    this.store.dispatch = (type: string, payload?: any): Promise<any> => {
      this.notifyMain({
        type,
        payload,
      })
      // return this.storeOriginalDispatch(type, payload, options)
      return Promise.resolve()
    }

    // Subscribe on changes from main process and apply them
    this.onNotifyRenderers((event, { type, payload } = { type: '', payload: null }) => {
      this.storeOriginalCommit(type, payload)
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
    this.onNotifyMain((event, { type, payload } = { type: '', payload: null }) => {
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
    switch (this.type) {
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

export default (): Plugin<unknown> => (store) => {
  const sharedMutations = new SharedMutations(store)
  sharedMutations.activatePlugin()
}
