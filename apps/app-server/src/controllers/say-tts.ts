import say from 'say'
import { handleError } from '../utils/requests'

import { v4 as uuid } from 'uuid'
import izabelaServer from '../server'

const path = require('path')
const fs = require('fs')

export const listVoicesHandler = async (_, res) => {
  try {
    const voices = await new Promise((resolve, reject) => {
      ;(say as any).getInstalledVoices((err: any, apiVoices: any) => {
        if (err) {
          return reject(err)
        }
        return resolve(apiVoices)
      })
    })
    res.status(200).json(voices)
  } catch (e) {
    handleError(res, 'Internal server error', e.message, 500)
  }
}

export const synthesizeSpeechHandler = async (
  {
    body: {
      payload: { text, voice, speed = 1 },
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

    await new Promise((resolve, reject) => {
      say.export(text, voice, speed, outputFile, (err) => {
        if (err) {
          reject(err)
        }
        resolve(true)
      })
    })

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
