import { useSettingsStore } from '@/features/settings/store'
import speech from '@google-cloud/speech'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import { store } from './store.ts'
import engine from './register.node.ts'

export default ({ useRecording, sampleRateHertz }: any) => {
  if (!engine.hasCredentials()) return
  const settingsStore = useSettingsStore()
  const client = new speech.v1p1beta1.SpeechClient()
  const lifecycle = createRecognitionLifecycle()
  return {
    startStream() {
      if (lifecycle.stopped) return
      const stream = client.streamingRecognize({
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
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => stream.write(chunk),
        onEnded: () => stream.end(),
        cleanup() {
          stream.destroy()
        },
      })
      stream.on('data', (res: any) => {
        const result = res?.results?.[0]
        if (result?.isFinal)
          turn.finish(result.alternatives?.[0]?.transcript || '')
      })
      stream.on('error', () => turn.finish('', 'error'))
      stream.on('end', () => turn.finish())
      stream.on('close', () => turn.finish())
      turn.start()
    },
    stopStream() {},
    cleanup() {
      if (lifecycle.stopped) return
      lifecycle.stop()
      Promise.resolve(client.close()).catch(console.error)
    },
  }
}
