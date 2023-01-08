import { RequestHandler } from 'express'
import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1'
import { IamAuthenticator } from 'ibm-watson/auth'
import { handleError } from '../../utils/requests'
import websocket from '../../websocket'
import { createMessageReceipt } from '../../utils/message'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
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
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
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

      const stream = result.pipe(res)
      stream.on('finish', () => {
        websocket.sendMessage(createMessageReceipt(text))
      })
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/ibm-watson/list-voices', listVoicesHandler)
  app.post('/api/tts/ibm-watson/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
