import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import OpenAI from 'openai'
import type { SpeechModel } from 'openai/resources/audio/speech'

// The speech endpoint's model/voice unions in the installed OpenAI SDK.
export const speechModels: SpeechModel[] = [
  'tts-1',
  'tts-1-hd',
  'gpt-4o-mini-tts',
  'gpt-4o-mini-tts-2025-12-15',
]

export const speechVoices = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
]

const legacyVoices = new Set([
  'alloy',
  'ash',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
])

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
        model,
      },
    },
    res,
  ) => {
    try {
      res
        .status(200)
        .json(
          model === 'tts-1' || model === 'tts-1-hd'
            ? speechVoices.filter((voice) => legacyVoices.has(voice))
            : speechVoices,
        )
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const listModelsHandler: RequestHandler = async (_req, res) => {
    try {
      res.status(200).json(speechModels)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
        payload: { input, voice, model, instructions, userInstructions },
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      res.setHeader('Content-Type', 'audio/mpeg')
      const openai = new OpenAI({ apiKey })

      const concatenatedInstructions = [
        instructions && `Follow these default instructions: "${instructions}"`,
        userInstructions &&
          `Follow these user provided instructions: "${userInstructions}"`,
      ]
        .filter(Boolean)
        .join('. ')
      const mp3 = await openai.audio.speech.create({
        model: model || 'gpt-4o-mini-tts',
        voice,
        input,
        instructions: concatenatedInstructions,
        response_format: 'mp3',
      })

      const arrayBuffer = await mp3.arrayBuffer()
      res.end(Buffer.from(arrayBuffer))
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  app.post('/api/tts/openai/list-voices', listVoicesHandler)
  app.post('/api/tts/openai/list-models', listModelsHandler)
  app.post('/api/tts/openai/synthesize-speech', synthesizeSpeechHandler)
  app.post('/api/tts/openai/synthesize-speech/stream', synthesizeSpeechHandler)
}

export default plugin
