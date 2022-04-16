import { handleError } from '../utils/requests'
import axios from 'axios'

import { v4 as uuid } from 'uuid'
import izabelaServer from '../server'

const path = require('path')
const util = require('util')
const fs = require('fs')

export const listVoicesHandler = async ({ body: { apiKey } }, res, next) => {
    try {
        const { data: { voices } } = await axios.get(`https://texttospeech.googleapis.com/v1beta1/voices?key=${ apiKey }`)
        res.status(200).json(voices)
    } catch (e) {
        handleError(res, "Internal server error", e.message, 500)
    }
}

export const synthesizeSpeechHandler = async ({ body: { apiKey, ...rest } }, res) => {
    const outputFile = path.join(izabelaServer.getTempPath(), uuid()+'.mp3')
    try {
        fs.mkdirSync(path.parse(outputFile).dir, { recursive: true }, (err) => {
            if (err) throw err
        })
        fs.writeFileSync(outputFile, '')
        const { data: { audioContent } } = await axios.post(`https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${ apiKey }`, rest)
        const writeFile = util.promisify(fs.writeFile)

        await writeFile(outputFile, Buffer.from(audioContent, 'base64'), 'binary')
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
        handleError(res, "Internal server error", e.message, 500)
    }
}
