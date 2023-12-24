import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const api = axios.create({
    baseURL: 'https://api.elevenlabs.io/v1',
  })
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
      } = await api.get('/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      })
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const listModelsHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      const { data: models } = await api.get('/models', {
        headers: {
          'xi-api-key': apiKey,
        },
      })
      res.status(200).json(models)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
        payload: {
          text,
          voice,
          stability,
          similarity_boost,
          use_speaker_boost,
          style,
          model_id,
        },
      },
    },
    res,
  ) => {
    try {
      const voice_settings = {
        stability,
        similarity_boost,
        use_speaker_boost,
        style,
      }
      const { data } = await api.post(
        `/text-to-speech/${voice.voice_id}/stream`,
        { model_id, text, voice_settings },
        {
          headers: {
            'xi-api-key': apiKey,
          },
          responseType: 'stream',
        },
      )
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
      })
      const stream = data.pipe(res)
      stream.on('finish', () => {})
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/elevenlabs/list-voices', listVoicesHandler)
  app.post('/api/tts/elevenlabs/list-models', listModelsHandler)
  app.post('/api/tts/elevenlabs/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
