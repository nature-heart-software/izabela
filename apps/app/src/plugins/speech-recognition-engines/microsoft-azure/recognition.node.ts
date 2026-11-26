import { useSettingsStore } from '@/features/settings/store'
import sdk from 'microsoft-cognitiveservices-speech-sdk'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import engine from './register.node.ts'
import { ENGINE_ID } from './shared.ts'
import { reportProviderError } from '@/features/session-errors/report'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey, region } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const speechConfig = sdk.SpeechConfig.fromSubscription(apiKey, region)
  speechConfig.speechRecognitionLanguage = settingsStore.speechInputLanguage
  const lifecycle = createRecognitionLifecycle(60000, (error) =>
    reportProviderError(error, 'speech-recognition', ENGINE_ID),
  )
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
      recognizer.canceled = (_, event) => {
        if (event.reason === sdk.CancellationReason.Error)
          turn.fail({
            // Azure's numeric codes are SDK-local, not shared transport codes.
            code:
              event.errorCode === sdk.CancellationErrorCode.ConnectionFailure
                ? 'ERR_NETWORK'
                : event.errorCode === sdk.CancellationErrorCode.ServiceTimeout
                  ? 'ETIMEDOUT'
                  : event.errorCode,
          })
        else turn.finish()
      }
      recognizer.recognizeOnceAsync(
        (result) => {
          turn.finish(
            result.reason === sdk.ResultReason.RecognizedSpeech
              ? result.text
              : '',
          )
        },
        (error) => turn.fail(error),
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
