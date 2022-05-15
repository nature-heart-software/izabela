import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1'
import { IamAuthenticator } from 'ibm-watson/auth'
import { handleError } from '../utils/requests'

export const listVoicesHandler = async (
  {
    body: {
      credentials: { apiKey, url },
    },
  },
  res,
) => {
  try {
    const textToSpeech = new TextToSpeechV1({
      authenticator: new IamAuthenticator({
        apikey: apiKey,
      }),
      serviceUrl: url,
    })
    const {
      result: { voices },
    } = await textToSpeech.listVoices()
    res.status(200).json(voices)
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}

export const synthesizeSpeechHandler = async (
  {
    body: {
      credentials: { apiKey, url },
      payload: { text, voice },
    },
  },
  res,
) => {
  try {
    const textToSpeech = new TextToSpeechV1({
      authenticator: new IamAuthenticator({
        apikey: apiKey,
      }),
      serviceUrl: url,
    })
    const { result } = await textToSpeech.synthesize({
      text,
      accept: 'audio/mp3',
      voice: voice.name,
    })

    result.pipe(res)
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}
