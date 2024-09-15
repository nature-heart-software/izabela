import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import path from 'path'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import util from 'util'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
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
            } = await axios.get(
                `https://texttospeech.googleapis.com/v1beta1/voices?key=${ apiKey }`,
            )
            res.status(200).json(voices)
        } catch (e: any) {
            handleError(res, 'Internal server error', e.message, 500)
        }
    }

    const synthesizeSpeechHandler: RequestHandler = async (
        {
            body: {
                credentials: { apiKey },
                payload,
            },
        },
        res,
    ) => {
        const outputFile = path.join(config?.tempPath || '', uuid()+'.wav')
        try {
            fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
            fs.writeFileSync(outputFile, '')
            const {
                data: { audioContent },
            } = await axios.post(
                `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${ apiKey }`,
                payload,
            )
            const writeFile = util.promisify(fs.writeFile)

            await writeFile(outputFile, Buffer.from(audioContent, 'base64'), 'binary')
            const stat = fs.statSync(outputFile)
            const total = stat.size

            res.writeHead(200, {
                'Content-Length': total,
                'Content-Type': 'audio/wav',
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
    app.post('/api/tts/google-cloud/list-voices', listVoicesHandler)
    app.post('/api/tts/google-cloud/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
