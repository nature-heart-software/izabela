// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import speech from '@google-cloud/speech'
import path from 'path'
import iohook from 'iohook'
import { app } from 'electron'
import { Deferred } from '@/utils/promise'
import store from '@/store'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
import { ipcMain } from 'electron-postman'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'

const encoding = 'LINEAR16' as const
const sampleRateHertz = 16000

app.whenReady().then(() => {
  const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
  const googleCloudSpeechCredentialsFilePath = path.join(
    credentialsDirPath,
    'google-cloud-speech-credentials.json',
  )
  process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCloudSpeechCredentialsFilePath
})

const getRequest = () => {
  const engine = speechEngineManager.getEngineById(
    store.getters['settings/persisted'].selectedSpeechEngine,
  )
  return {
    config: {
      encoding,
      sampleRateHertz,
      languageCode: engine?.getLanguageCode() || DEFAULT_LANGUAGE_CODE,
    },
  }
}

let deferredRecording: Deferred<boolean> | null = null

iohook.on('keydown', (event) => {
  if ([3640, 54].includes(event.keycode) && !deferredRecording) {
    const deferred = new Deferred<boolean>()
    deferredRecording = deferred
    ipcMain.sendTo('audio-worker-window', 'speech-record-start')
  }
})

iohook.on('keyup', (event) => {
  if ([3640, 54].includes(event.keycode) && deferredRecording) {
    deferredRecording.resolve(true)
    deferredRecording = null
    ipcMain.sendTo('audio-worker-window', 'speech-record-stop')
  }
})

ipcMain.on('audio-worker-window', 'transcribe-audio', async (content: string) => {
  const client = new speech.SpeechClient()
  const audio = {
    content,
  }

  const request = {
    ...getRequest(),
    audio,
  }

  const [operation] = await client.longRunningRecognize(request)
  const [response]: any = await operation.promise()
  const transcription = response.results
    .map((result: any) => result.alternatives[0].transcript)
    .join('\n')
  console.log(`Transcription: ${transcription}`)
})
