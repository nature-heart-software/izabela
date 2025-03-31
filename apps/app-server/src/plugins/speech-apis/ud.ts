import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import axios, { AxiosResponse } from 'axios'
import { Readable } from 'stream'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
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
        payload,
      },
    },
    res,
  ) => {
    try {
      res.setHeader('Content-Type', 'audio/mpeg')
      const s = new Readable()

      const { data }: AxiosResponse<ArrayBuffer> = await axios({
        url: 'https://api.uberduck.ai/speak-synchronous',
        method: 'POST',
        headers: {
          Authorization: `Basic ${ Buffer.from(
            `${ publicKey }:${ privateKey }`,
          ).toString('base64') }`,
        },
        data: payload,
        responseType: 'arraybuffer',
      })

      const stream = s.pipe(res)
      stream.on('finish', () => {
      })
      s.push(Buffer.from(data))
      s.push(null)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/uberduck/list-voices', listVoicesHandler)
  app.post('/api/tts/uberduck/synthesize-speech', synthesizeSpeechHandler)
  app.post('/api/tts/uberduck/synthesize-speech/stream', synthesizeSpeechHandler)
}

export default plugin
