import { copyFile, mkdir, stat, writeFile } from 'fs/promises'
import path from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { IzabelaMessagePayload } from '@/modules/izabela/types'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { useSettingsStore } from '@/features/settings/store'

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
})

export default ElectronFilesystem()
