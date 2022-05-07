import { bridge } from '@izabela/electron-bridger'
import { copyFile, mkdir, stat } from 'fs/promises'
import path from 'path'
import { app } from 'electron'

class ElectronFilesystem {
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
  }

  getGoogleCloudSpeechCredentialsPath(): Promise<string> {
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    return stat(googleCloudSpeechCredentialsFilePath)
      .then(() => googleCloudSpeechCredentialsFilePath)
      .catch(() => '')
  }
}

declare global {
  interface Window {
    ElectronFilesystem: ElectronFilesystem
  }
}

export default ((): ElectronFilesystem => bridge.new(ElectronFilesystem)())()
