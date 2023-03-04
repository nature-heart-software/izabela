import { app } from 'electron'
import path from 'path'
import pkg from '@root/package.json'
import { mkdir, readdir, rm, stat } from 'fs/promises'

export default () =>
  app.whenReady().then(async () => {
    // clear cache
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    const files = await readdir(directory)
    Array.from(files).forEach((f) => {
      stat(path.join(directory, f)).then((s) => {
        // if it hasn't been accessed in the last day, delete it
        if (s.atimeMs < Date.now() - 1000 * 60 * 60 * 24 * 7) {
          rm(path.join(directory, f))
        }
      })
    })
  })
