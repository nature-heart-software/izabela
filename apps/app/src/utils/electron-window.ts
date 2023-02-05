import os from "os"
import BrowserWindow = Electron.Main.BrowserWindow

export const getNativeWindowHandleInt = (win: BrowserWindow) => {
  const hbuf = win.getNativeWindowHandle()

  if (os.endianness() === "LE") {
    return hbuf.readInt32LE()
  }

  return hbuf.readInt32BE()

}
