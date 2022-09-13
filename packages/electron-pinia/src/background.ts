import { Connections, IpcMainEventHandler, IpcMainInvokeEventHandler, ShareStatePayload } from './types'
import { IPC_EVENT_CONNECT, IPC_EVENT_NOTIFY_MAIN, IPC_EVENT_NOTIFY_RENDERERS } from './consts'
import { purify } from '@packages/toolbox'
import { useArgs } from './utils'
import { ipcMain } from './electron'

export default (() => {
    const connections: Connections = {}

    function onConnect(handler: IpcMainInvokeEventHandler) {
        ipcMain?.handle(IPC_EVENT_CONNECT, handler)
    }

    function notifyRenderers(
        payload: ShareStatePayload,
        issuer: string | number = '',
    ) {
        Object.keys(connections).forEach((processId) => {
            if (
                processId !== (typeof issuer === 'number' ? issuer.toString() : issuer)
            ) {
                connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, purify(payload))
            }
        })
    }

    function onNotifyMain(handler: IpcMainEventHandler<[ShareStatePayload]>) {
        ipcMain?.on(IPC_EVENT_NOTIFY_MAIN, handler)
    }

    const start = () => {
        onConnect((event) => {
            const win = event.sender
            const winId = win.id
            connections[winId] = win
            win.on('destroyed', () => {
                delete connections[winId]
            })
            return winId
        })
        onNotifyMain((_, { name, storeId, args }) => {
            const { issuer, args: newArgs } = useArgs(args)
            notifyRenderers({ name, storeId, args: newArgs }, issuer)
        })
    }
    return {
        start,
        notifyRenderers,
        onNotifyMain,
    }
})()
