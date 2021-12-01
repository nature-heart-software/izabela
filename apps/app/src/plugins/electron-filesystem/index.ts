import fs from 'fs/promises';
import {bridge} from '@izabela/electron-bridger';

class Filesystem {
  readdir(path = './') {
    return fs.readdir(path);
  }
}

export default bridge.new(Filesystem)() as iza.Filesystem;

declare global {
  namespace iza {
    interface Filesystem {
      readdir: (path?: string) => Promise<string[]>
    }
  }
  const Filesystem: iza.Filesystem;
  interface Window { Filesystem: iza.Filesystem; }
}
