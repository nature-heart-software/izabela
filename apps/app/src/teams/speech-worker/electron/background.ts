import { app } from 'electron'
import path from 'path'

export { default as createSpeechWorkerWindow } from './window'
app.whenReady().then(() => {
  const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
  const googleCloudSpeechCredentialsFilePath = path.join(
    credentialsDirPath,
    'google-cloud-speech-credentials.json',
  )
  process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCloudSpeechCredentialsFilePath
})
