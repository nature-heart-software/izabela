import once from 'lodash/once'

import sdk from 'microsoft-cognitiveservices-speech-sdk'

export default ({ useRecording }: any) => {
  const speechConfig = sdk.SpeechConfig.fromSubscription('', '')

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
            stream.write(chunk.slice())
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

      function onRecognizeOnceAsync(result: sdk.SpeechRecognitionResult) {
        resolve(result.text)
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
