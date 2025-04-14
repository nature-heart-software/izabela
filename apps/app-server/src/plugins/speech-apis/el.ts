import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import { ElevenLabsClient } from 'elevenlabs'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      const client = new ElevenLabsClient({ apiKey })
      const { voices } = await client.voices.getAll({
        show_legacy: true,
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
      const client = new ElevenLabsClient({ apiKey })
      const models = await client.models.getAll()
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
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      res.setHeader('Content-Type', 'audio/mpeg')
      const client = new ElevenLabsClient({ apiKey })
      const payload = {
        text,
        model_id,
        voice_settings: {
          stability,
          similarity_boost,
          use_speaker_boost,
          style,
        },
      }
      if (includeTimestamps) {
        const response = await client.textToSpeech.streamWithTimestamps(
          voice.voice_id,
          payload,
        )
        let index = 0
        for await (const item of response) {
          const { audio_base64, alignment, normalized_alignment } = item
          if (index === 0) {
            res.setHeader(
              'Data',
              JSON.stringify({
                timestamps: {
                  alignment,
                  normalized_alignment,
                },
              }),
            )
          }
          index++

          res.write(Buffer.from(audio_base64, 'base64'))
        }
        return res.end()
      }

      const stream = await client.textToSpeech.convertAsStream(
        voice.voice_id,
        payload,
      )

      stream.pipe(res)
      stream.on('finish', () => {})
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  app.post('/api/tts/elevenlabs/list-voices', listVoicesHandler)
  app.post('/api/tts/elevenlabs/list-models', listModelsHandler)
  app.post('/api/tts/elevenlabs/synthesize-speech', synthesizeSpeechHandler)
  app.post(
    '/api/tts/elevenlabs/synthesize-speech/stream',
    synthesizeSpeechHandler,
  )
}

export default plugin
