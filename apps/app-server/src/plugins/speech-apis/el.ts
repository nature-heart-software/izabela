import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import hash from 'object-hash'

const plugin: Izabela.Server.Plugin = ({ app }) => {
    const api = axios.create({
        baseURL: 'https://api.elevenlabs.io/v1',
    })
    let settingsCache: string = ''
    const listVoicesHandler: RequestHandler = async (
        {
            body: {
                credentials: { apiKey },
            },
        },
        res,
    ) => {
        try {
            const {
                data: { voices },
            } = await api
                .get('/voices', {
                    headers: {
                        "xi-api-key": apiKey,
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
                credentials: { apiKey },
                payload: { text, voice, stability, similarity_boost },
            },
        },
        res,
    ) => {

        try {
            const settings = {
                stability,
                similarity_boost,
            }
            const hashedSettings = hash({ ...settings, voice_id: voice.voice_id })
            if (settingsCache !== hashedSettings) {
                await api.post(`/voices/${ voice.voice_id }/settings/edit`, settings, {
                    headers: {
                        "xi-api-key": apiKey,
                    },
                })
                settingsCache = hashedSettings
            }
            const {
                data,
            } = await api.post(
                `/text-to-speech/${ voice.voice_id }/stream`, { text }, {
                    headers: {
                        "xi-api-key": apiKey,
                    },
                    responseType: 'stream',
                },
            )
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
            })
            const stream = data.pipe(res)
            stream.on('finish', () => {
            })
        } catch (e: any) {
            handleError(res, 'Internal server error', e.message, 500)
        }
    }
    app.post('/api/tts/elevenlabs/list-voices', listVoicesHandler)
    app.post('/api/tts/elevenlabs/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
