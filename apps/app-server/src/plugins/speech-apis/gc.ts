import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import { Readable } from 'stream'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      const {
        data: { voices },
      } = await axios.get(
        `https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}`,
      )
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: (stream?: boolean) => RequestHandler = (
    streamAudio,
  ) => {
    return async (
      {
        body: {
          credentials: { apiKey },
          payload,
        },
      },
      res,
    ) => {
      try {
        const s = new Readable()
        const {
          data: { audioContent },
        } = await axios.post(
          `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
          {
            ...payload,
            audioConfig: {
              ...payload.audioConfig,

              audioEncoding: streamAudio ? 'MP3' : 'LINEAR16',
            },
          },
        )

        const stream = s.pipe(res)
        stream.on('finish', () => {})
        s.push(Buffer.from(audioContent, 'base64'))
        s.push(null)

        res.writeHead(200, {
          'Content-Type': streamAudio ? 'audio/mpeg' : 'audio/wav',
        })
      } catch (e: any) {
        handleError(res, 'Internal server error', e.message, 500)
      }
    }
  }
  app.post('/api/tts/google-cloud/list-voices', listVoicesHandler)
  app.post('/api/tts/google-cloud/synthesize-speech', synthesizeSpeechHandler())
  app.post(
    '/api/tts/google-cloud/synthesize-speech/stream',
    synthesizeSpeechHandler(true),
  )
}

export default plugin
