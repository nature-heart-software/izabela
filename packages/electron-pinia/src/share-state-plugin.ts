import { PiniaPlugin } from 'pinia'
import {
    IPC_EVENT_CONNECT,
    IPC_EVENT_NOTIFY_MAIN,
    IPC_EVENT_NOTIFY_RENDERERS,
    isMain,
    isPreload,
    isRenderer,
} from './consts'
import {
    AugmentedGlobal,
    Connections,
    IpcMainEventHandler,
    IpcMainInvokeEventHandler,
    IpcRendererEventHandler,
    ShareStatePayload,
} from './types'
import { purify } from './utils'

export const shareStatePlugin: PiniaPlugin = ({store}) => {
    const processType = isRenderer ? 'renderer' : 'main'
    const ipcMain = isMain && typeof global !== 'undefined' ? (global as AugmentedGlobal).ipcMain : null
    const ipcRenderer = isRenderer && typeof window !== 'undefined' ? window.ElectronPinia : null

    function notifyRenderers(
        connections: Connections,
        payload: ShareStatePayload,
        issuer = '',
    ) {
        Object.keys(connections).forEach((processId) => {
            if (processId !== issuer) {
                connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, purify(payload))
            }
        })
    }

    function connect() {
        return ipcRenderer?.SEND_IPC_EVENT_CONNECT()
    }

    function onConnect(handler: IpcMainInvokeEventHandler) {
        ipcMain?.handle(IPC_EVENT_CONNECT, handler)
    }

    function notifyMain(payload: ShareStatePayload) {
        ipcRenderer?.SEND_IPC_EVENT_NOTIFY_MAIN(purify(payload))
    }

    function onNotifyMain(handler: IpcMainEventHandler<[ShareStatePayload]>) {
        ipcMain?.on(IPC_EVENT_NOTIFY_MAIN, handler)
    }

    function onNotifyRenderers(handler: IpcRendererEventHandler<[ShareStatePayload]>) {
        ipcRenderer?.ON_IPC_EVENT_NOTIFY_RENDERERS(handler)
    }

    async function rendererProcessLogic() {
        const winId = await connect()

        store.$onAction(({ name, store, args }) => {
            const hasIssuer = args.some((arg) => typeof arg === 'object' && arg.issuer)
            if (hasIssuer) return
            notifyMain({ name, storeId: store.$id, args: [...args, { issuer: winId }] })
        });

        onNotifyRenderers((_, {name, storeId, args}) => {
            if (storeId === store.$id) store[name](...args)
        })
    }

    function mainProcessLogic() {
        const connections: Connections = {}
        onConnect((event) => {
            const win = event.sender
            const winId = win.id

            connections[winId] = win
            win.on('destroyed', () => {
                delete connections[winId]
            })
            return winId
        })

        store.$onAction(({ name, store, args }) => {
            const issuer = args.find((arg) => typeof arg === 'object' && arg.issuer) || 'main'
            notifyRenderers(connections, { name, storeId: store.$id, args: [...args.filter((o) => typeof o !== 'object' || !o.issuer ), { issuer }] }, issuer)
        });

        onNotifyMain((_, { name, storeId, args }) => {
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
