const express = require('express')
const app = express()
const pkg = require('./package.json')
const say = require('say')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

// Change this depending on your environment
const ENDPOINT_BASE_URL = 'http://localhost'
const ENDPOINT_PORT = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.post('/list-voices', async (req, res) => {
    try {
        const {
            body: {
                credentials: {
                    apiKey, // API key provided by the user if required
                },
            },
        } = req
        const voices = await new Promise((resolve, reject) => {
            say.getInstalledVoices((err, voices) => {
                if (err) return reject(err)
                return resolve(voices)
            })
        })
        res.status(200).json(
            voices.map((name) => ({
                id: name, // id must be unique
                name, // name of the voice
                category: 'Say', // category of the voice
                languageCode: 'en-US', // language code of the voice
            })),
        )
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

app.post('/synthesize-speech', async (req, res) => {
    try {
        const {
            body: {
                credentials: {
                    apiKey, // API key provided by the user if required
                },
                payload: {
                    text, // message to be spoken
                    voice: {
                        id, // id must be unique
                        name, // name of the voice
                        category, // category of the voice
                        languageCode, // language code of the voice
                    },
                },
            },
        } = req
        const outputFile = path.join(__dirname, 'example.mp3')
        fs.mkdirSync(path.parse(outputFile).dir, {recursive: true})
        fs.writeFileSync(outputFile, '')

        await new Promise((resolve, reject) => {
            say.export(text, name, 1, outputFile, (err) => {
                if (err) {
                    reject(err)
                }
                resolve(true)
            })
        })

        res.writeHead(200, {
            'Content-Type': 'audio/mp3',
        })
        const stream = fs.createReadStream(outputFile).pipe(res)
        stream.on('finish', () => {
            fs.unlinkSync(outputFile)
        })
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

app.listen(ENDPOINT_PORT, () => {
    console.log(
        `[${pkg.name}] API endpoint: ${ENDPOINT_BASE_URL}${
            ENDPOINT_PORT ? `:${ENDPOINT_PORT}` : ''
        }`,
    )
})
