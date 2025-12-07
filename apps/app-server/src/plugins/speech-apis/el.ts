import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

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
        showLegacy: true,
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
      const models = await client.models.list()
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
          similarityBoost,
          useSpeakerBoost,
          style,
          modelId,
          speed,
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
        modelId,
        voiceSettings: {
          stability,
          similarityBoost,
          useSpeakerBoost,
          style,
          speed,
        },
      }
      if (includeTimestamps) {
        const response = await client.textToSpeech.streamWithTimestamps(
          voice.voiceId,
          payload,
        )
        let index = 0
        for await (const item of response) {
          const { audioBase64, alignment, normalizedAlignment } = item
          if (index === 0) {
            res.setHeader(
              'Data',
              JSON.stringify({
                timestamps: {
                  alignment,
                  normalizedAlignment,
                },
              }),
            )
          }
          index++

          res.write(Buffer.from(audioBase64, 'base64'))
        }
        return res.end()
      }

      const readable = await client.textToSpeech.stream(voice.voiceId, payload)
      const reader = readable.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      } finally {
        reader.releaseLock()
      }
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
