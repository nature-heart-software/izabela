import { Commit, Dispatch, MutationPayload, Plugin, Store } from 'vuex'
import {
  AugmentedGlobal,
  Connections,
  IpcMainMutationEventHandler,
  IpcRenderer,
  IpcRendererMutationEventHandler,
  ProcessType,
} from '@/modules/electron-vuex/types'
import { purify } from '@/utils/object'
import { IPC_EVENT_CONNECT, IPC_EVENT_NOTIFY_MAIN, IPC_EVENT_NOTIFY_RENDERERS } from './consts'

const SharedMutations = (store: Store<unknown>) => {
  const processType: ProcessType = typeof window !== 'undefined' ? 'renderer' : 'main'
  const { ipcMain } = global as AugmentedGlobal
  const ipcRenderer: IpcRenderer | null =
    typeof window !== 'undefined' ? window.ElectronVuex.ipcRenderer : null
  let storeOriginalCommit: Commit
  let storeOriginalDispatch: Dispatch

  function notifyRenderers(
    connections: Connections,
    payload: MutationPayload,
    sourceProcessId = '',
  ) {
    Object.keys(connections).forEach((processId) => {
      if (processId !== sourceProcessId) {
        connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, purify(payload))
      }
    })
  }

  function connect() {
    if (ipcRenderer) ipcRenderer.SEND_IPC_EVENT_CONNECT()
  }

  function onConnect(handler: IpcMainMutationEventHandler) {
    ipcMain.on(IPC_EVENT_CONNECT, handler)
  }

  function notifyMain(payload: MutationPayload) {
    if (ipcRenderer) ipcRenderer.SEND_IPC_EVENT_NOTIFY_MAIN(payload)
  }

  function onNotifyMain(handler: IpcMainMutationEventHandler) {
    ipcMain.on(IPC_EVENT_NOTIFY_MAIN, handler)
  }

  function onNotifyRenderers(handler: IpcRendererMutationEventHandler) {
    if (ipcRenderer) ipcRenderer.ON_IPC_EVENT_NOTIFY_RENDERERS(handler)
  }

  function rendererProcessLogic() {
    // Connect renderer to main process
    connect()

    // Save original Vuex methods
    storeOriginalCommit = store.commit
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    storeOriginalDispatch = store.dispatch

    // Don't use commit in renderer outside of actions
    // eslint-disable-next-line no-param-reassign
    store.commit = () => {
      throw new Error("[Vuex Electron] Please, don't use direct commit's, use dispatch instead of ")
    }

    // Forward dispatch to main process
    // eslint-disable-next-line no-param-reassign
    store.dispatch = (type: string, payload?: any): Promise<any> => {
      notifyMain({
        type,
        payload,
      })
      // return storeOriginalDispatch(type, payload, options)
      return Promise.resolve()
    }

    // Subscribe on changes from main process and apply them
    onNotifyRenderers((event, { type, payload } = { type: '', payload: null }) => {
      storeOriginalCommit(type, payload)
    })
  }

  function mainProcessLogic() {
    const connections: Connections = {}

    // Save new connection
    onConnect((event) => {
      const win = event.sender
      const winId = win.id

      connections[winId] = win

      // Remove connection when window is closed
      win.on('destroyed', () => {
        delete connections[winId]
      })
    })

    // Subscribe on changes from renderer processes
    onNotifyMain((event, { type, payload } = { type: '', payload: null }) => {
      store.dispatch(type, payload)
    })

    // Subscribe on changes from Vuex store
    store.subscribe((mutation: MutationPayload) => {
      const { type, payload } = mutation

      // Forward changes to renderer processes
      notifyRenderers(connections, { type, payload })
    })
  }

  function start() {
    switch (processType) {
      case 'renderer':
        rendererProcessLogic()
        break
      case 'main':
        mainProcessLogic()
        break
      default:
        throw new Error('[Vuex Electron] Type should be "renderer" or "main".')
    }
  }
  return {
    start,
  }
}

export default (): Plugin<unknown> => (store) => {
  const isPreload = !!(typeof window !== 'undefined' && window.ElectronVuexIsPreload)
  if (isPreload) return
  const sharedMutations = SharedMutations(store)
  sharedMutations.start()
}
