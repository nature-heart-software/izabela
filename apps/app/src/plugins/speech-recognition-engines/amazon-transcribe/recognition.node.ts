import { useSettingsStore } from '@/features/settings/store'
import once from 'lodash/once'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import {
  LanguageCode,
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
} from '@aws-sdk/client-transcribe-streaming'
import { PassThrough } from 'stream'
import {store} from './store.ts'

const getCredentials = async () => {
  const credentials = fromCognitoIdentityPool({
    clientConfig: {
      region: store.getProperty('region'),
    },
    identityPoolId: store.getProperty('identityPoolId', true),
  })
  const res = await credentials()
  return res as {
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  }
}

export default ({ useRecording }: any) => {
  const settingsStore = useSettingsStore()
  let credentials: Awaited<ReturnType<typeof getCredentials>>
  const region = store.getProperty('region')

  async function refreshCredentials() {
    credentials = await getCredentials()
  }

  const interval = setInterval(refreshCredentials, 290 * 1000)
  refreshCredentials()

  return {
    async startStream() {
      if (!credentials) return
      let ended = false

      const client = new TranscribeStreamingClient({
        region,
        credentials,
      })

      const audioPayloadStream = new PassThrough({ highWaterMark: 1024 })

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!ended) {
            audioPayloadStream.write(chunk)
          }
        },
        onEnded() {
          audioPayloadStream.end()
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        ended = true
        recording.stopPumping()
        audioPayloadStream.end()
        client.destroy()
      })

      recording.startPumping()

      const audioStream = async function* () {
        for await (const payloadChunk of audioPayloadStream) {
          yield { AudioEvent: { AudioChunk: payloadChunk } }
        }
      }

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: settingsStore.speechInputLanguage as LanguageCode,
        MediaEncoding: 'pcm',
        MediaSampleRateHertz: 16000,
        AudioStream: audioStream(),
      })

      try {
        const response = await client.send(command)
        if (response.TranscriptResultStream) {
          for await (const event of response.TranscriptResultStream) {
            if (event.TranscriptEvent) {
              const results = event.TranscriptEvent.Transcript?.Results
              results?.map((result) => {
                ;(result.Alternatives || []).map((alternative) => {
                  const transcript = alternative.Items?.map(
                    (item) => item.Content,
                  ).join(' ')
                  if (results[0] && !results[0].IsPartial) {
                    resolve(transcript)
                  }
                })
              })
            }
          }
        }
        resolve()
      } catch (e) {
        resolve()
      }
    },
    stopStream() {},
    cleanup() {
      clearInterval(interval)
    },
  }
}
