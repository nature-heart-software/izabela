import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'

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
            const {
                data: { voices },
            } = await axios
                .get('https://api.elevenlabs.io/v1/voices', {
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
                payload: { text, voice },
            },
        },
        res,
    ) => {

        try {
            const {
                data,
            } = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${ voice.voice_id }/stream`, { text }, {
                    headers: {
                        'Content-Type': 'audio/mpeg',
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
