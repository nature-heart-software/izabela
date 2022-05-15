// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import Websocket from 'websocket-stream'
import speech from '@google-cloud/speech'
import path from 'path'
import iohook from 'iohook'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'
import { Deferred } from '@/utils/promise'
import store from '@/store'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'

let wsStream: any = null
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
      languageCode: engine?.getLanguageCode() || 'en-US',
    },
    interimResults: false, // If you want interim results, set this to true
  }
}

let ws: WebSocket | null = null
const wss: Websocket.Server = (Websocket.createServer as any)(
  {
    port: 1243,
    host: '127.0.0.1',
  },
  (stream: any) => {
    wsStream = stream
    stream
      .on('close', () => {
        console.log('stream closed')
      })
      .on('error', () => {
        console.log('stream error')
      })
  },
)
wss.on('connection', (WebSocket) => {
  ;(ws as any) = WebSocket
})
const recognizeStream = () =>
  new speech.SpeechClient()
    .streamingRecognize(getRequest())
    .on('error', console.error)
    .on('data', (data: any) => {
      const transcription =
        data.results[0] && data.results[0].alternatives[0]
          ? data.results[0].alternatives[0].transcript
          : ''
      process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `Transcription: ${transcription}\n`
          : '\n\nReached transcription time limit, press Ctrl+C\n',
      )
      if (ws) ws.send(transcription)
    })

let deferredRecording: Deferred<boolean> | null = null

class Recording {
  id = uuid()

  constructor(stream: any, deferred: Deferred<boolean>) {
    console.log('Starting recording - ', this.id)
    wsStream.pipe(stream)
    deferred.promise.then(() => {
      console.log('Stopping recording - ', this.id)
      stream.end()
      wsStream.unpipe(stream)
    })
  }
}

iohook.on('keyup', (event) => {
  if ([29, 54].includes(event.keycode) && deferredRecording) {
    deferredRecording.resolve(true)
    deferredRecording = null
  }
})

iohook.on('keydown', (event) => {
  if ([29, 54].includes(event.keycode) && wsStream && !deferredRecording) {
    const deferred = new Deferred<boolean>()
    deferredRecording = deferred
    // eslint-disable-next-line no-new
    new Recording(recognizeStream(), deferred)
  }
})
