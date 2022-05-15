import {
  DescribeVoicesCommand,
  Polly,
  SynthesizeSpeechCommand,
} from '@aws-sdk/client-polly'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { handleError } from '../utils/requests'

export const listVoicesHandler = async (
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
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}

export const synthesizeSpeechHandler = async (
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
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}
