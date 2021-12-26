import fs from 'fs/promises'
import { bridge } from '@izabela/electron-bridger'

class ElectronFilesystem {
  readdir(path = './') {
    return fs.readdir(path)
  }
}

declare global {
  const ElectronFilesystem: ElectronFilesystem
  interface Window {
    ElectronFilesystem: ElectronFilesystem
  }
}

export default ((): ElectronFilesystem => bridge.new(ElectronFilesystem)())()
