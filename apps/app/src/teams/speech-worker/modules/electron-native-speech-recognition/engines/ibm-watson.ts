import once from 'lodash/once'
import { ibmWatsonSpeechRecognitionPlugin } from '@/features/speech/store/plugins/ibm-watson.ts'
import { IamAuthenticator } from 'ibm-watson/auth'
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1'

export default ({ useRecording }: any) => {
  const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
      apikey: ibmWatsonSpeechRecognitionPlugin.getProperty('apiKey', true),
    }),
    serviceUrl: ibmWatsonSpeechRecognitionPlugin.getProperty('url'),
  })

  return {
    async startStream() {
      let ended = false

      const stream = speechToText.recognizeUsingWebSocket({
        objectMode: true,
        contentType: 'audio/l16;rate=16000;channels=1',
        model: 'en-US_BroadbandModel',
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
