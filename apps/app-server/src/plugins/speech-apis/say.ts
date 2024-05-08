import { RequestHandler } from 'express'
import say from 'say'
import { handleError } from '../../utils/requests'
import path from 'path'
import { v4 as uuid } from 'uuid'
import fs from 'fs'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
    const listVoicesHandler: RequestHandler = async (_, res) => {
        // @ts-ignore
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
        } catch (e: any) {
            handleError(res, 'Internal server error', e.message, 500)
        }
    }

    const synthesizeSpeechHandler: RequestHandler = async (
        {
            body: {
                payload: { text, voice, speed = 1 },
            },
        },
        res,
    ) => {
        const outputFile = path.join(
            config?.tempPath || '',
            uuid()+'.mp3',
        )
        try {
            fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
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

    app.get('/api/tts/say/list-voices', listVoicesHandler)
    app.post('/api/tts/say/list-voices', listVoicesHandler)
    app.post('/api/tts/say/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
