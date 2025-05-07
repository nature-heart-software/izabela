import { useSettingsStore } from '@/features/settings/store'
import speech from '@google-cloud/speech'
import once from 'lodash/once'
import { store } from './store.ts'
import engine from './register.node.ts'

export default ({ useRecording, sampleRateHertz }: any) => {
  if (!engine.hasCredentials()) return
  const settingsStore = useSettingsStore()
  const client = new speech.v1p1beta1.SpeechClient()

  return {
    startStream() {
      let currentTranscript = ''
      let streamEnded = false
      const stream = client
        .streamingRecognize({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz,
            languageCode: settingsStore.speechInputLanguage,
            enableAutomaticPunctuation: true,
            model: 'latest_long',
            useEnhanced: true,
            profanityFilter: store.getProperty('profanityFilter'),
          },
          singleUtterance: true,
          interimResults: true,
        })
        .on('data', onData)
        .on('error', onError)
        .on('end', onEnd)
        .on('close', onClose)

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!streamEnded) {
            stream.write(chunk)
          }
        },
        onEnded() {
          stream.end()
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        streamEnded = true
        recording.stopPumping()
        stream.removeAllListeners()
        stream.end()
      })

      function onData(res: any) {
        currentTranscript = res.results[0]?.alternatives[0].transcript
        if (res.results[0]?.isFinal) {
          resolve(res.results[0].alternatives[0].transcript)
        }
      }

      function onError() {
        resolve()
      }

      function onEnd() {
        if (!currentTranscript) {
          resolve()
        }
        setTimeout(() => {
          resolve()
        }, 1000)
      }

      function onClose() {
        resolve()
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {
      client.close()
    },
  }
}
