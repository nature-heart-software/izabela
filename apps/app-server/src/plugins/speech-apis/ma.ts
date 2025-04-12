import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import {
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  SpeechSynthesisWordBoundaryEventArgs,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk'
import { Readable } from 'stream'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, region },
      },
    },
    res,
  ) => {
    try {
      const endpoint = `https://${ region }.tts.speech.${
        region.startsWith('china') ? 'azure.cn' : 'microsoft.com'
      }/cognitiveservices/voices/list`
      const { data: voices } = await axios.get(endpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      })
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, region },
        payload,
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      const s = new Readable()

      const timestamps: SpeechSynthesisWordBoundaryEventArgs[] = []
      const speechConfig = SpeechConfig.fromSubscription(apiKey, region)
      speechConfig.speechSynthesisLanguage = payload.voice.Locale
      speechConfig.speechSynthesisVoiceName = payload.voice.ShortName
      speechConfig.speechSynthesisOutputFormat =
        SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3

      if (includeTimestamps) speechConfig.requestWordLevelTimestamps()

      const synthesizer = new SpeechSynthesizer(speechConfig)

      if (includeTimestamps) {
        synthesizer.wordBoundary = (_, e) => {
          timestamps.push(e)
        }
      }

      const audioContent: ArrayBuffer = await new Promise((resolve, reject) => {
        if (payload.ssml) {
          synthesizer.speakSsmlAsync(
            payload.ssml,
            (result) => {
              resolve(result.audioData)
              synthesizer.close()
            },
            (error) => {
              reject(error)
              synthesizer.close()
            },
          )
        } else {
          synthesizer.speakTextAsync(
            payload.text,
            (result) => {
              resolve(result.audioData)
              synthesizer.close()
            },
            (error) => {
              reject(error)
              synthesizer.close()
            },
          )
        }
      })

      const stream = s.pipe(res)
      stream.on('finish', () => {
      })
      s.push(Buffer.from(audioContent))
      s.push(null)

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
      return handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/microsoft-azure/list-voices', listVoicesHandler)
  app.post(
    '/api/tts/microsoft-azure/synthesize-speech',
    synthesizeSpeechHandler,
  )
  app.post(
    '/api/tts/microsoft-azure/synthesize-speech/stream',
    synthesizeSpeechHandler,
  )
}

export default plugin
