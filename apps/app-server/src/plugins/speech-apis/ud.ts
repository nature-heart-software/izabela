import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import izabelaServer from '../../server'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import util from 'util'
import path from 'path'
import axios, { AxiosResponse } from 'axios'
import websocket from '../../websocket'
import { createMessageReceipt } from '../../utils/message'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    { body: { payload: { mode } = { mode: 'tts-all' } } },
    res,
  ) => {
    try {
      const { data: voices }: AxiosResponse = await axios({
        url: 'https://api.uberduck.ai/voices',
        method: 'GET',
        params: {
          mode,
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
        credentials: { publicKey, privateKey },
        payload: { voicemodel_uuid, text: speech },
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

      const { data }: AxiosResponse<ArrayBuffer> = await axios({
        url: 'https://api.uberduck.ai/speak-synchronous',
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${publicKey}:${privateKey}`,
          ).toString('base64')}`,
        },
        data: {
          voicemodel_uuid,
          speech,
        },
        responseType: 'arraybuffer',
      })

      const writeFile = util.promisify(fs.writeFile)

      await writeFile(outputFile, Buffer.from(data), 'base64')
      const stat = fs.statSync(outputFile)
      const total = stat.size

      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'audio/mp3',
      })
      const stream = fs.createReadStream(outputFile).pipe(res)
      stream.on('finish', () => {
        fs.unlinkSync(outputFile)
        websocket.sendMessage(createMessageReceipt(speech))
      })
    } catch (e: any) {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
      }
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/uberduck/list-voices', listVoicesHandler)
  app.post('/api/tts/uberduck/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
