import { useSettingsStore } from '@/features/settings/store'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import {
  LanguageCode,
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
} from '@aws-sdk/client-transcribe-streaming'
import { PassThrough } from 'stream'
import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
import engine from './register.node.ts'

const getCredentials = async () => {
  const { region, identityPoolId } = engine.getCredentials()
  return fromCognitoIdentityPool({ clientConfig: { region }, identityPoolId })()
}
export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { region } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const lifecycle = createRecognitionLifecycle()
  let credentials: Awaited<ReturnType<typeof getCredentials>> | undefined
  let refreshing: Promise<typeof credentials> | undefined
  function refreshCredentials() {
    if (refreshing) return refreshing
    refreshing = getCredentials()
      .then((value) => {
        if (!lifecycle.stopped) credentials = value
        return value
      })
      .catch((error) => {
        console.error('Unable to refresh transcription credentials', error)
        return undefined
      })
      .finally(() => {
        refreshing = undefined
      })
    return refreshing
  }
  const interval = setInterval(() => {
    void refreshCredentials()
  }, 290 * 1000)
  void refreshCredentials()
  return {
    async startStream() {
      if (lifecycle.stopped) return
      const audio = new PassThrough({ highWaterMark: 1024 })
      let client: TranscribeStreamingClient | undefined
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => audio.write(chunk),
        onEnded: () => audio.end(),
        cleanup() {
          audio.destroy()
          client?.destroy()
        },
      })
      turn.start()
      const available = credentials || (await refreshCredentials())
      if (turn.ended || lifecycle.stopped) return
      if (!available) {
        turn.finish('', 'error')
        return
      }
      client = new TranscribeStreamingClient({ region, credentials: available })
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: settingsStore.speechInputLanguage as LanguageCode,
        MediaEncoding: 'pcm',
        MediaSampleRateHertz: 16000,
        AudioStream: (async function* () {
          for await (const chunk of audio)
            yield { AudioEvent: { AudioChunk: chunk } }
        })(),
      })
      try {
        const response = await client.send(command)
        if (response.TranscriptResultStream)
          for await (const event of response.TranscriptResultStream) {
            const result = event.TranscriptEvent?.Transcript?.Results?.find(
              (entry) => !entry.IsPartial,
            )
            if (result) {
              turn.finish(
                result.Alternatives?.[0]?.Items?.map(
                  (item) => item.Content || '',
                ).join(' ') || '',
              )
              break
            }
          }
        turn.finish()
      } catch {
        turn.finish('', 'error')
      }
    },
    stopStream() {},
    cleanup() {
      lifecycle.stop()
      clearInterval(interval)
    },
  }
}
