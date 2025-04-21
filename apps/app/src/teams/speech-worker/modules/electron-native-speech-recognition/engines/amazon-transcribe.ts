import { useSettingsStore } from '@/features/settings/store'
import { amazonTranscribeSpeechRecognitionPlugin } from '@/features/speech/store/plugins/amazon-transcribe.ts'
import once from 'lodash/once'
import crypto from 'crypto'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import WebSocket from 'ws'

const getCredentials = async () => {
  const credentials = fromCognitoIdentityPool({
    clientConfig: {
      region: amazonTranscribeSpeechRecognitionPlugin.getProperty('region'),
    },
    identityPoolId: amazonTranscribeSpeechRecognitionPlugin.getProperty(
      'identityPoolId',
      true,
    ),
  })
  const res = await credentials()
  return res as {
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  }
}

function signUrl({
  accessKeyId,
  secretAccessKey,
  region,
  languageCode,
}: {
  accessKeyId: string
  secretAccessKey: string
  region: string
  languageCode: string
}) {
  const endpoint = `transcribestreaming.${region}.amazonaws.com:8443`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const service = 'transcribe'
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': '300',
    'X-Amz-SignedHeaders': 'host',
    'language-code': languageCode,
    'media-encoding': 'pcm',
    'sample-rate': '16000',
  })

  const canonicalHeaders = `host:${endpoint}\n`
  const signedHeaders = 'host'
  const canonicalRequest = `GET /stream-transcription-websocket HTTP/1.1\n${canonicalHeaders}\n${signedHeaders}\n${crypto
    .createHash('sha256')
    .update('')
    .digest('hex')}`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex')}`

  const getSignatureKey = (
    key: string,
    date: string,
    region: string,
    service: string,
  ) => {
    const kDate = crypto
      .createHmac('sha256', 'AWS4' + key)
      .update(date)
      .digest()
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update(service)
      .digest()
    return crypto.createHmac('sha256', kService).update('aws4_request').digest()
  }

  const signingKey = getSignatureKey(
    secretAccessKey,
    dateStamp,
    region,
    service,
  )
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex')

  queryParams.set('X-Amz-Signature', signature)

  return `wss://${endpoint}/stream-transcription-websocket?${queryParams.toString()}`
}

export default ({ useRecording }: any) => {
  const settingsStore = useSettingsStore()
  let ws: WebSocket
  let credentials: Awaited<ReturnType<typeof getCredentials>>

  async function refreshCredentials() {
    credentials = await getCredentials()
  }

  setInterval(refreshCredentials, 290 * 1000)
  refreshCredentials()

  return {
    async startStream() {
      let ended = false
      const signedUrl = signUrl({
        ...credentials,
        region: amazonTranscribeSpeechRecognitionPlugin.getProperty('region'),
        languageCode: settingsStore.speechInputLanguage,
      })

      ws = new WebSocket(signedUrl)

      ws.onopen = () => {
        console.log('WebSocket connected to Amazon Transcribe')
      }

      ws.onmessage = (msg) => {
        console.log(msg)
        const message = msg
        const results = message.Transcript?.Results
        if (
          results &&
          results.length > 0 &&
          results[0].Alternatives.length > 0
        ) {
          const transcript = results[0].Alternatives[0].Transcript
          const isFinal = !results[0].IsPartial
          console.log(
            isFinal ? `🟢 Final: ${transcript}` : `🟡 Interim: ${transcript}`,
          )
          if (isFinal) {
            resolve(transcript)
          }
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err.message)
        resolve()
      }

      ws.on('close', (code, reason) => {
        console.log(`WebSocket closed: ${code} — ${reason.toString()}`)
      })

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!ended && ws.readyState === WebSocket.OPEN) {
            ws.send(chunk)
          }
        },
        onEnded() {
          resolve('')
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        ended = true
        recording.stopPumping()
        ws.close()
      })

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
