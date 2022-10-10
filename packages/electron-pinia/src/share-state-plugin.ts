import { PiniaPlugin } from 'pinia'
import { Deferred, purify } from '@packages/toolbox'
import { getIssuer, useArgs } from './utils'
import { IpcRendererEventHandler, ShareStatePayload } from './types'
import background from './background'
import { ipcRenderer, isPreload, isRenderer } from './electron'

export const shareStatePlugin = ({ store }: Parameters<PiniaPlugin>[0]) => {
  const deferredIsReady = Deferred<boolean>()
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

  async function rendererProcessLogic() {
    const winId = await connect()
    const $patch = store.$patch
    store.$patch = (...args: any[]) => {
      $patch(args[0])
      const hasIssuer = getIssuer(args)
      if (hasIssuer || typeof args[0] === 'function') return
      notifyMain({
        name: '$patch',
        storeId: store.$id,
        args: [...args, { issuer: winId }],
      })
    }
    store.$onAction(({ name, store, args }) => {
      const hasIssuer = getIssuer(args)
      if (hasIssuer) return
      notifyMain({
        name,
        storeId: store.$id,
        args: [...args, { issuer: winId }],
      })
    }, true)

    onNotifyRenderers((_, { name, storeId, args }) => {
      if (storeId === store.$id) store[name](...args)
    })
  }

  function mainProcessLogic() {
    const $patch = store.$patch
    store.$patch = (...args: any[]) => {
      $patch(args[0])
      if (typeof args[0] === 'function') return
      const { issuer, args: newArgs } = useArgs(args)
      background.notifyRenderers(
        { name: '$patch', storeId: store.$id, args: newArgs },
        issuer,
      )
    }

    // store.$onAction(({ name, store, args }) => {
    //   const { issuer, args: newArgs } = useArgs(args)
    //   background.notifyRenderers(
    //     { name, storeId: store.$id, args: newArgs },
    //     issuer,
    //   )
    // }, true)

    background.onNotifyMain((_, { name, storeId, args }) => {
      if (storeId === store.$id) store[name](...args)
    })
  }

  async function start() {
    switch (processType) {
      case 'renderer':
        await rendererProcessLogic()
        break
      case 'main':
        mainProcessLogic()
        break
    }
  }

  if (!isPreload) {
    start().then(() => {
      deferredIsReady.resolve(true)
    })
  }
  return deferredIsReady.promise
}
