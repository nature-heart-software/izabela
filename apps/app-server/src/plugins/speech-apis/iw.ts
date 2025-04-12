import { RequestHandler } from 'express'
import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1'
import { IamAuthenticator } from 'ibm-watson/auth'
import { handleError } from '../../utils/requests'
import WebSocket from 'ws'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, url },
      },
    },
    res,
  ) => {
    try {
      const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: apiKey,
        }),
        serviceUrl: url,
      })
      const {
        result: { voices },
      } = await textToSpeech.listVoices()
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, url },
        payload,
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      res.setHeader('Content-Type', 'audio/mpeg')
      if (includeTimestamps) {
        const getAccessToken = async () => {
          const response = await fetch(
            'https://iam.cloud.ibm.com/identity/token',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
                apikey: process.env.IWTTS_API_KEY || '',
              }),
            },
          )

          const data = await response.json()
          return data.access_token
        }
        const wsURI = `${process.env.IWTTS_URL}/v1/synthesize?voice=${payload.voice}&rate_percentage=${payload.ratePercentage}&pitch_percentage=${payload.pitchPercentage}`
        const websocket = new WebSocket(wsURI, {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
        })

        const audioChunks: any[] = []
        const timestamps: any[] = []

        await new Promise<void>((resolve, reject) => {
          websocket.onopen = function () {
            const message = {
              text: payload.text,
              accept: 'audio/mpeg',
              timings: ['words'],
            }
            websocket.send(JSON.stringify(message))
          }

          websocket.onmessage = function (e: any) {
            if (typeof e.data === 'string') {
              const data = JSON.parse(e.data)
              if (data.words) timestamps.push(data.words.flat(1))
            } else {
              const chunk = Buffer.from(e.data, 'binary')
              audioChunks.push(chunk)
            }
          }

          websocket.onclose = function () {
            resolve()
          }

          websocket.onerror = function () {
            reject()
          }
        })

        res.setHeader(
          'Data',
          JSON.stringify({
            timestamps,
          }),
        )
        res.write(Buffer.concat(audioChunks))
        return res.end()
      }
      const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: apiKey,
        }),
        serviceUrl: url,
      })
      const { result } = await textToSpeech.synthesize({
        ...payload,
        accept: 'audio/mpeg',
      })

      const stream = result.pipe(res)
      stream.on('finish', () => {})
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/ibm-watson/list-voices', listVoicesHandler)
  app.post('/api/tts/ibm-watson/synthesize-speech', synthesizeSpeechHandler)
  app.post(
    '/api/tts/ibm-watson/synthesize-speech/stream',
    synthesizeSpeechHandler,
  )
}

export default plugin
