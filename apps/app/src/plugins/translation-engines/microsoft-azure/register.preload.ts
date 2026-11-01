import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'

// Register the existing IPC proxy without loading the main-process SDK.
bridge.register([[electronModuleName, () => ({ translate() {} })]])
