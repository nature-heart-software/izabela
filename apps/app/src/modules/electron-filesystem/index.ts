import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'fs/promises'
import path from 'path'
import { app, BrowserWindow } from 'electron'
import { IzabelaMessagePayload } from '@/modules/izabela/types'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { useSettingsStore } from '@/features/settings/store'
import pkg from '@root/package.json'
import mime from 'mime'
import { ElectronDialog } from '@/modules/electron-dialog'
import { createPrivateKey, randomUUID } from 'crypto'

// reusable arrow function to encode file data to base64 encoded string
const convertFileToBase64 = async (filePath: string) => {
  // read binary data from file
  const bitmap = await readFile(filePath)
  // convert the binary data to base64 encoded string
  return bitmap.toString('base64')
}

export const ElectronFilesystem = () => ({
  async importGoogleCloudSpeechCredentials(
    credentialsPath: string,
  ): Promise<string> {
    const content = await readFile(credentialsPath, 'utf8')
    const credentials = JSON.parse(content)
    if (
      credentials?.type !== 'service_account' ||
      typeof credentials.project_id !== 'string' ||
      !credentials.project_id.trim() ||
      typeof credentials.client_email !== 'string' ||
      !credentials.client_email.includes('@') ||
      typeof credentials.private_key !== 'string'
    )
      throw new Error('Invalid service account credentials')
    createPrivateKey(credentials.private_key)
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    await mkdir(credentialsDirPath, { recursive: true })
    const temporary = `${googleCloudSpeechCredentialsFilePath}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, content, { mode: 0o600, flag: 'wx' })
      await rename(temporary, googleCloudSpeechCredentialsFilePath)
    } finally {
      await rm(temporary, { force: true })
    }
    return googleCloudSpeechCredentialsFilePath
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
      settingsStore.preferredSavDir &&
      (await stat(settingsStore.preferredSavDir))
        ? settingsStore.preferredSavDir
        : app.getPath('downloads')
    const options = {
      title: 'Save file',
      defaultPath: path.join(directory, `${filename}.${extension}`),
      // defaultPath: app.getPath('downloads'),
      filters: [
        {
          name: 'Audio',
          extensions: [
            'mp3',
            'wav',
            'ogg',
            'flac',
            'aac',
            'm4a',
            'opus',
            'webm',
            'wma',
          ],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    }

    const res = await ElectronDialog().showSaveDialog(
      ElectronWindowManager.getInstanceByName('messenger')
        ?.window as BrowserWindow,
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
        `data:${mimeType};base64,${await convertFileToBase64(
          path.join(directory, file),
        )}`,
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
  async clearCache(): Promise<boolean> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await rm(directory, { recursive: true, force: true })
    await mkdir(directory, { recursive: true })
    return Promise.resolve(true)
  },
})

export default ElectronFilesystem()
