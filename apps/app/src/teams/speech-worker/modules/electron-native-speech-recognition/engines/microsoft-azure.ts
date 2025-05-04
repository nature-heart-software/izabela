import { useSettingsStore } from '@/features/settings/store'
import { microsoftAzureSpeechRecognitionPlugin } from '@/features/speech/store/plugins/microsoft-azure'
import once from 'lodash/once'

import sdk from 'microsoft-cognitiveservices-speech-sdk'

export default ({ useRecording }: any) => {
  const settingsStore = useSettingsStore()
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    microsoftAzureSpeechRecognitionPlugin.getProperty('apiKey', true),
    microsoftAzureSpeechRecognitionPlugin.getProperty('region'),
  )
  speechConfig.speechRecognitionLanguage = settingsStore.speechInputLanguage

  return {
    startStream() {
      let ended = false

      const stream = sdk.AudioInputStream.createPushStream()
      const audioConfig = sdk.AudioConfig.fromStreamInput(stream)
      const speechRecognizer = new sdk.SpeechRecognizer(
        speechConfig,
        audioConfig,
      )

      speechRecognizer.recognizeOnceAsync(onRecognizeOnceAsync)

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!ended) {
            stream.write(chunk)
          }
        },
        onEnded() {
          speechRecognizer.close()
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        ended = true
        recording.stopPumping()
        speechRecognizer.close()
      })

      speechRecognizer.canceled = () => resolve()

      function onRecognizeOnceAsync(result: sdk.SpeechRecognitionResult) {
        switch (result.reason) {
          case sdk.ResultReason.RecognizedSpeech:
            resolve(result.text)
            break
          case sdk.ResultReason.NoMatch:
            resolve()
            break
          case sdk.ResultReason.Canceled:
            resolve()
            break
        }
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {
      speechConfig.close()
    },
  }
}
