import fs from 'fs/promises';
import { bridge } from '@izabela/electron-bridger';

export interface ElectronFilesystemInstance {
  readdir: (path?: string) => Promise<string[]>;
}

declare global {
  const ElectronFilesystem: ElectronFilesystemInstance;
  interface Window {
    ElectronFilesystem: ElectronFilesystemInstance;
  }
}

class ElectronFilesystem {
  readdir(path = './') {
    return fs.readdir(path);
  }
}

const createElectronFilesystemInstance = (): ElectronFilesystemInstance => {
  return bridge.new(ElectronFilesystem)();
};

export default createElectronFilesystemInstance();
