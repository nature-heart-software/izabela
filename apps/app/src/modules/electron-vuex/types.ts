import {MutationPayload} from 'vuex'
import IpcRendererEvent = Electron.IpcRendererEvent

export type IpcRendererHandler = (event: IpcRendererEvent, mutation: MutationPayload) => void
