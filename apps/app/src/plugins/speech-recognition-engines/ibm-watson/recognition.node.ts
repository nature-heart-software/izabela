import { IamAuthenticator } from 'ibm-watson/auth'
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1'
import { SpeechModel } from 'ibm-watson/speech-to-text/v1-generated'
import { useSettingsStore } from '@/features/settings/store'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import engine from './register.node.ts'
import { PassThrough } from 'stream'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey, url } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const lifecycle = createRecognitionLifecycle()
  const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({ apikey: apiKey }),
    serviceUrl: url,
  })
  const modelsReady: Promise<SpeechModel[]> = speechToText
    .listModels()
    .then((response) => {
      return response.result.models
    })
    .catch((error) => {
      console.error('Unable to list recognition models', error)
      return []
    })
  return {
    async startStream() {
      if (lifecycle.stopped) return
      const audio = new PassThrough()
      let stream:
        | ReturnType<typeof speechToText.recognizeUsingWebSocket>
        | undefined
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => audio.write(chunk),
        onEnded: () => audio.end(),
        cleanup() {
          audio.destroy()
          stream?.destroy()
        },
      })
      turn.start()
      const models = await modelsReady
      if (turn.ended || lifecycle.stopped) return
      const target = `${settingsStore.speechInputLanguage}_Multimedia`
      try {
        stream = speechToText.recognizeUsingWebSocket({
          objectMode: true,
          contentType: 'audio/l16;rate=16000;channels=1',
          model: models.some((m) => m.name === target)
            ? target
            : 'en-US_Multimedia',
        })
        stream.on('data', (msg: any) => {
          const result = msg?.results?.[0]
          if (result?.final)
            turn.finish(result.alternatives?.[0]?.transcript || '')
        })
        stream.on('error', () => turn.finish('', 'error'))
        stream.on('close', () => turn.finish())
        stream.on('end', () => turn.finish())
        audio.on('data', (chunk) => stream?.write(chunk))
        audio.on('end', () => stream?.end())
      } catch {
        turn.finish('', 'error')
      }
    },
    stopStream() {},
    cleanup() {
      lifecycle.stop()
    },
  }
}
