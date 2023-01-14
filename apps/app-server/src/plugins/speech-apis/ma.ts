import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import path from 'path'
import izabelaServer from '../../server'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk'
import util from 'util'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, region },
      },
    },
    res,
  ) => {
    try {
      const endpoint = `https://${region}.tts.speech.${
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
      },
    },
    res,
  ) => {
    const outputFile = path.join(
      izabelaServer.getConfig().tempPath,
      uuid() + '.mp3',
    )
    try {
      fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
      fs.writeFileSync(outputFile, '')

      const speechConfig = SpeechConfig.fromSubscription(apiKey, region)
      speechConfig.speechSynthesisLanguage = payload.voice.Locale
      speechConfig.speechSynthesisVoiceName = payload.voice.ShortName
      speechConfig.speechSynthesisOutputFormat =
        SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3
      const audioConfig = AudioConfig.fromAudioFileOutput(outputFile)

      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)
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

      const writeFile = util.promisify(fs.writeFile)

      await writeFile(outputFile, Buffer.from(audioContent), 'binary')
      const stat = fs.statSync(outputFile)
      const total = stat.size

      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'audio/mp3',
      })
      const stream = fs.createReadStream(outputFile).pipe(res)
      stream.on('finish', () => {
        fs.unlinkSync(outputFile)
      })
    } catch (e: any) {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
      }
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/microsoft-azure/list-voices', listVoicesHandler)
  app.post(
    '/api/tts/microsoft-azure/synthesize-speech',
    synthesizeSpeechHandler,
  )
}

export default plugin
