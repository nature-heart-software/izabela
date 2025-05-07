import once from 'lodash/once'
import { IamAuthenticator } from 'ibm-watson/auth'
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1'
import { SpeechModel } from 'ibm-watson/speech-to-text/v1-generated'
import { useSettingsStore } from '@/features/settings/store'
import {store} from './store.ts'
import engine from './register.node.ts'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const settingsStore = useSettingsStore()
  const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
      apikey: store.getProperty('apiKey', true),
    }),
    serviceUrl: store.getProperty('url'),
  })
  let models: SpeechModel[] = []
  speechToText.listModels().then((speechModels) => {
    models = speechModels.result.models
  })

  const getModelName = () => {
    const targetModelName = `${settingsStore.speechInputLanguage}_Multimedia`
    const model = models.find((m) => m.name === targetModelName)
    return model ? targetModelName : 'en-US_Multimedia'
  }

  return {
    async startStream() {
      let ended = false

      const stream = speechToText.recognizeUsingWebSocket({
        objectMode: true,
        contentType: 'audio/l16;rate=16000;channels=1',
        model: getModelName(),
      })

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!ended) {
            stream.write(chunk)
          }
        },
        onEnded() {
          stream.end()
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        ended = true
        recording.stopPumping()
        stream.end()
      })

      stream.on('data', function (msg) {
        if (msg.results?.[0]?.alternatives?.[0]) {
          const transcript = msg.results[0].alternatives[0].transcript
          const final = msg.results[0].final
          if (final) {
            resolve(transcript)
          }
        }
      })

      stream.on('error', () => {
        resolve()
      })

      stream.on('close', () => {
        resolve()
      })

      stream.on('end', () => {
        resolve()
      })

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
