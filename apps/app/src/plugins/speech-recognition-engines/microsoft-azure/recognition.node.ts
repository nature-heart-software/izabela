import { useSettingsStore } from '@/features/settings/store'
import sdk from 'microsoft-cognitiveservices-speech-sdk'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import engine from './register.node.ts'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey, region } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const speechConfig = sdk.SpeechConfig.fromSubscription(apiKey, region)
  speechConfig.speechRecognitionLanguage = settingsStore.speechInputLanguage
  const lifecycle = createRecognitionLifecycle()
  return {
    startStream() {
      if (lifecycle.stopped) return
      const stream = sdk.AudioInputStream.createPushStream()
      const audioConfig = sdk.AudioConfig.fromStreamInput(stream)
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => stream.write(chunk),
        onEnded: () => stream.close(),
        cleanup() {
          recognizer.close()
          audioConfig.close()
        },
      })
      recognizer.canceled = () => turn.finish('', 'error')
      recognizer.recognizeOnceAsync(
        (result) => {
          turn.finish(
            result.reason === sdk.ResultReason.RecognizedSpeech
              ? result.text
              : '',
          )
        },
        () => turn.finish('', 'error'),
      )
      turn.start()
    },
    stopStream() {},
    cleanup() {
      if (lifecycle.stopped) return
      lifecycle.stop()
      speechConfig.close()
    },
  }
}
