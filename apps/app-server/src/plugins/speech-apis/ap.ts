import { RequestHandler } from 'express'
import {
  DescribeVoicesCommand,
  Polly,
  SynthesizeSpeechCommand,
} from '@aws-sdk/client-polly'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { handleError } from '../../utils/requests'
import { Readable } from 'stream'

function parseSpeechMarks(stream: Readable): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const result: any[] = []

    stream.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) result.push(JSON.parse(line))
      }
    })

    stream.on('end', () => resolve(result))
    stream.on('error', reject)
  })
}

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { identityPoolId, region },
      },
    },
    res,
  ) => {
    try {
      const client = new Polly({
        region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: identityPoolId,
        }),
      })
      const command = new DescribeVoicesCommand({})
      const { Voices: voices } = await client.send(command)
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { identityPoolId, region },
        payload,
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      let timestamps: any[] = []
      const client = new Polly({
        region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: identityPoolId,
        }),
      })

      const [audioRes, markRes] = await Promise.all(
        [
          client.send(
            new SynthesizeSpeechCommand({
              ...payload,
              OutputFormat: 'mp3',
            }),
          ),
          includeTimestamps &&
            client.send(
              new SynthesizeSpeechCommand({
                ...payload,
                SpeechMarkTypes: ['word'],
                OutputFormat: 'json',
              }),
            ),
        ].filter(Boolean),
      )

      if (markRes) {
        timestamps = await parseSpeechMarks((markRes.AudioStream as any)!)
      }

      const stream = (audioRes.AudioStream as any).pipe(res)
      stream.on('finish', () => {})

      if (timestamps.length) {
        res.setHeader(
          'Data',
          JSON.stringify({
            timestamps,
          }),
        )
      }
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
      })
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/amazon-polly/list-voices', listVoicesHandler)
  app.post('/api/tts/amazon-polly/synthesize-speech', synthesizeSpeechHandler)
  app.post(
    '/api/tts/amazon-polly/synthesize-speech/stream',
    synthesizeSpeechHandler,
  )
}

export default plugin
