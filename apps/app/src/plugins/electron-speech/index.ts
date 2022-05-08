// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import Websocket from 'websocket-stream'
import speech from '@google-cloud/speech'
import path from 'path'
import iohook from 'iohook'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'

let wsStream: any = null
const encoding = 'LINEAR16' as const
const sampleRateHertz = 16000
const languageCode = 'en-US'

app.whenReady().then(() => {
  const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
  const googleCloudSpeechCredentialsFilePath = path.join(
    credentialsDirPath,
    'google-cloud-speech-credentials.json',
  )
  process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCloudSpeechCredentialsFilePath
})

const request = {
  config: {
    encoding,
    sampleRateHertz,
    languageCode,
  },
  interimResults: false, // If you want interim results, set this to true
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
    .streamingRecognize(request)
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

let listening = false

class Recorder {
  id = uuid()

  gcStream

  onKeyUpBinded: any

  constructor(gcStream: any) {
    console.log('Starting recording - ', this.id)
    this.gcStream = gcStream
    wsStream.pipe((this as any).gcStream)
    this.onKeyUpBinded = this.onKeyUp.bind(this)
    iohook.on('keyup', this.onKeyUpBinded)
  }

  onKeyUp(event: any) {
    if (event.keycode === 54) {
      console.log('Stopping recording - ', this.id)
      this.gcStream.end()
      wsStream.unpipe((this as any).gcStream)
      iohook.off('keyup', this.onKeyUpBinded)
      listening = false
    }
  }
}

iohook.on('keydown', (event) => {
  if (event.keycode === 54 && wsStream && !listening) {
    listening = true
    // eslint-disable-next-line no-new
    new Recorder(recognizeStream())
  }
})
