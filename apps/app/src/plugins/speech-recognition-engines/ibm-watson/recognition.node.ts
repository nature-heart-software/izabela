import { IamAuthenticator } from 'ibm-watson/auth'
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1'
import { SpeechModel } from 'ibm-watson/speech-to-text/v1-generated'
import { useSettingsStore } from '@/features/settings/store'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import engine from './register.node.ts'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey, url } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const lifecycle = createRecognitionLifecycle()
  const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({ apikey: apiKey }),
    serviceUrl: url,
  })
  let models: SpeechModel[] = []
  speechToText
    .listModels()
    .then((response) => {
      if (!lifecycle.stopped) models = response.result.models
    })
    .catch((error) => console.error('Unable to list recognition models', error))
  return {
    startStream() {
      if (lifecycle.stopped) return
      const target = `${settingsStore.speechInputLanguage}_Multimedia`
      const stream = speechToText.recognizeUsingWebSocket({
        objectMode: true,
        contentType: 'audio/l16;rate=16000;channels=1',
        model: models.some((m) => m.name === target)
          ? target
          : 'en-US_Multimedia',
      })
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => stream.write(chunk),
        onEnded: () => stream.end(),
        cleanup() {
          stream.destroy()
        },
      })
      stream.on('data', (msg: any) => {
        const result = msg?.results?.[0]
        if (result?.final)
          turn.finish(result.alternatives?.[0]?.transcript || '')
      })
      stream.on('error', () => turn.finish('', 'error'))
      stream.on('close', () => turn.finish())
      stream.on('end', () => turn.finish())
      turn.start()
    },
    stopStream() {},
    cleanup() {
      lifecycle.stop()
    },
  }
}
