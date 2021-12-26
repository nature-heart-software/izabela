import fs from 'fs/promises'
import { bridge } from '@izabela/electron-bridger'
import ElectronWindowManager from "@/modules/electron-window-manager";
class ElectronMessengerWindow {
  focus() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const {window} = messenger;
      window.setFocusable(true); // Fixes alwaysOnTop going in the background sometimes for some reasons
      window.focus(); // Fixes issues with Chrome and input elements
      window.setIgnoreMouseEvents(false);
    }
    return Promise.resolve();
  }
 blur() {
    const messenger = ElectronWindowManager.getInstanceByName('messenger')
    if (messenger) {
      const {window} = messenger;
      window.setFocusable(false); // Fixes alwaysOnTop going in the background sometimes for some reasons
      window.blur(); // Fixes issues with Chrome and input elements
      window.setIgnoreMouseEvents(true, {forward: true});
    }
    return Promise.resolve();
  }
}

declare global {
  interface Window {
    ElectronMessengerWindow: ElectronMessengerWindow
  }
}

export default ((): ElectronMessengerWindow => bridge.new(ElectronMessengerWindow)())()
