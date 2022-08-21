import { RequestHandler } from 'express'
import {
  DescribeVoicesCommand,
  Polly,
  SynthesizeSpeechCommand,
} from '@aws-sdk/client-polly'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { handleError } from '../../utils/requests'

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
        payload: { text, voice },
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
      const command = new SynthesizeSpeechCommand({
        OutputFormat: 'mp3',
        Text: text,
        VoiceId: voice.Id,
      })
      const { AudioStream } = await client.send(command)
      ;(AudioStream as any).pipe(res)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/amazon-polly/list-voices', listVoicesHandler)
  app.post('/api/tts/amazon-polly/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
