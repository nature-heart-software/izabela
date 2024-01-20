import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { IzabelaMessagePayload } from '@/modules/izabela/types'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { useSettingsStore } from '@/features/settings/store'
import pkg from '@root/package.json'
import mime from 'mime'

// reusable arrow function to encode file data to base64 encoded string
const convertFileToBase64 = async (filePath: string) => {
  // read binary data from file
  const bitmap = await readFile(filePath)
  // convert the binary data to base64 encoded string
  return bitmap.toString('base64')
}

export const ElectronFilesystem = () => ({
  importGoogleCloudSpeechCredentials(credentialsPath: string): Promise<string> {
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    // NOTE: need to secure this one day somehow
    return mkdir(credentialsDirPath, { recursive: true })
      .then(() => copyFile(credentialsPath, googleCloudSpeechCredentialsFilePath))
      .then(() => Promise.resolve(googleCloudSpeechCredentialsFilePath))
  },
  getGoogleCloudSpeechCredentialsPath(): Promise<string> {
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    return stat(googleCloudSpeechCredentialsFilePath)
      .then(() => googleCloudSpeechCredentialsFilePath)
      .catch(() => '')
  },
  async downloadMessagePrompt(
    message: IzabelaMessagePayload,
    filename: string,
    content: string,
  ): Promise<string> {
    const settingsStore = useSettingsStore()
    await settingsStore.$whenReady()
    const extension = content.split(';')[0].split('/')[1]
    const directory =
      settingsStore.preferredSavDir && (await stat(settingsStore.preferredSavDir))
        ? settingsStore.preferredSavDir
        : app.getPath('downloads')
    const options = {
      title: 'Save file',
      defaultPath: path.join(directory, `${filename}.${extension}`),
      // defaultPath: app.getPath('downloads'),
      filters: [
        {
          name: 'Audio',
          extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'webm', 'wma'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    }

    const res = await dialog.showSaveDialog(
      ElectronWindowManager.getInstanceByName('messenger')?.window as BrowserWindow,
      options,
    )
    if (!res.filePath) return Promise.reject(Error('No file selected'))
    await writeFile(res.filePath, content.split(',').pop() as string, 'base64')
    settingsStore.preferredSavDir = path.dirname(res.filePath)
    return Promise.resolve(res.filePath)
  },
  async cacheAudio(id: string, content: string): Promise<boolean> {
    const extension = content.split(';')[0].split('/')[1]
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    await writeFile(
      path.join(directory, `${id}.${extension}`),
      content.split(',').pop() as string,
      'base64',
    )
    return Promise.resolve(true)
  },
  async getCachedAudio(id: string): Promise<string | null> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    const files = await readdir(directory)
    const file = files.find((f) => f.startsWith(id))
    if (file) {
      const mimeType = mime.getType(path.join(directory, file))
      return Promise.resolve(
        `data:${mimeType};base64,${await convertFileToBase64(path.join(directory, file))}`,
      )
    }
    return Promise.resolve(null)
  },
  async deleteCachedAudio(id: string): Promise<boolean> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    const files = await readdir(directory)
    const file = files.find((f) => f.startsWith(id))
    if (file) {
      await rm(path.join(directory, file))
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  },
})

export default ElectronFilesystem()
