import { PiniaPlugin } from 'pinia'
import {
  ipcRenderer,
  isPreload,
  isRenderer,
} from './consts'
import {
  IpcRendererEventHandler,
  ShareStatePayload,
} from './types'
import { purify, useArgs } from './utils'
import background from './background'

export const shareStatePlugin: PiniaPlugin = ({ store }) => {
  const processType = isRenderer ? 'renderer' : 'main'

  function connect() {
    return ipcRenderer?.SEND_IPC_EVENT_CONNECT()
  }


  function notifyMain(payload: ShareStatePayload) {
    ipcRenderer?.SEND_IPC_EVENT_NOTIFY_MAIN(purify(payload))
  }

  function onNotifyRenderers(
    handler: IpcRendererEventHandler<[ShareStatePayload]>,
  ) {
    ipcRenderer?.ON_IPC_EVENT_NOTIFY_RENDERERS(handler)
  }

  function rendererProcessLogic() {
    const winId = connect()
    store.$onAction(({ name, store, args }) => {
      const hasIssuer = args.some(
        (arg) => typeof arg === 'object' && arg.issuer,
      )
      if (hasIssuer) return
      notifyMain({
        name,
        storeId: store.$id,
        args: [...args, { issuer: winId }],
      })
    })

    onNotifyRenderers((_, { name, storeId, args }) => {
      if (storeId === store.$id) store[name](...args)
    })
  }

  function mainProcessLogic() {
    store.$onAction(({ name, store, args }) => {
      const { issuer, args: newArgs } = useArgs(args)
      background.notifyRenderers(
        { name, storeId: store.$id, args: newArgs },
        issuer,
      )
    })

    background.onNotifyMain((_, { name, storeId, args }) => {
      if (storeId === store.$id) store[name](...args)
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

  if (!isPreload) {
    start()
  }
}
