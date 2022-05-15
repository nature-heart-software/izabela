import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk'
import { handleError } from '../utils/requests'
import axios from 'axios'

import { v4 as uuid } from 'uuid'
import izabelaServer from '../server'

const path = require('path')
const util = require('util')
const fs = require('fs')

export const listVoicesHandler = async (
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
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}

export const synthesizeSpeechHandler = async (
  {
    body: {
      credentials: { apiKey, region },
      payload: { text, voice },
    },
  },
  res,
) => {
  const outputFile = path.join(
    izabelaServer.getConfig().tempPath,
    uuid() + '.mp3',
  )
  try {
    fs.mkdirSync(path.parse(outputFile).dir, { recursive: true }, (err) => {
      if (err) throw err
    })
    fs.writeFileSync(outputFile, '')

    const speechConfig = SpeechConfig.fromSubscription(apiKey, region)
    speechConfig.speechSynthesisLanguage = voice.Locale
    speechConfig.speechSynthesisVoiceName = voice.ShortName
    speechConfig.speechSynthesisOutputFormat =
      SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3
    const audioConfig = AudioConfig.fromAudioFileOutput(outputFile)

    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)
    const audioContent: ArrayBuffer = await new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          resolve(result.audioData)
          synthesizer.close()
        },
        (error) => {
          reject(error)
          synthesizer.close()
        },
      )
    })

    const writeFile = util.promisify(fs.writeFile)

    await writeFile(outputFile, Buffer.from(audioContent), 'binary')
    const stat = fs.statSync(outputFile)
    const total = stat.size

    res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'audio/mp3' })
    const stream = fs.createReadStream(outputFile).pipe(res)
    stream.on('finish', () => {
      fs.unlinkSync(outputFile)
    })
  } catch (e) {
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile)
    }
    handleError(res, 'Internal server error', e.message, 500)
  }
}
