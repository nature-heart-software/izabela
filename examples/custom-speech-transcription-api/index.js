const express = require('express')
const app = express()
const port = 3000
const pkg = require('./package.json')
const cors = require('cors')
const bodyParser = require('body-parser')
const io = require('socket.io-client')
const { Readable } = require('node:stream')
const { ElevenLabsClient } = require('elevenlabs')
const { Blob } = require('buffer')
const {
  writeFileSync,
  createReadStream,
  createWriteStream,
} = require('node:fs')
const { resolve, join } = require('node:path')
const FileWriter = require('wav').FileWriter

// Change this depending on your environment
const ENDPOINT_BASE_URL = 'http://localhost'
const ENDPOINT_PORT = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(port, () => {
  console.log(
    `[${pkg.name}] API endpoint: ${ENDPOINT_BASE_URL}${
      ENDPOINT_PORT ? `:${ENDPOINT_PORT}` : ''
    }`,
  )
})

const socket = io(`ws://localhost:7071`)

globalThis.Blob = Blob

const client = new ElevenLabsClient({
  apiKey: '',
})

// socket.on('speech:recording:data:end', async (data) => {
//   console.time('Performance')
//   const buffer = Buffer.concat(data)
//   const audioStream = Readable.from([buffer])
//   const pcmPath = resolve('recording.pcm')
//   const wavPath = resolve('recording.wav')
//
//   writeFileSync(pcmPath, buffer)
//   audioStream.pipe(
//     new FileWriter(wavPath, {
//       sampleRate: 16000,
//       channels: 1,
//     }),
//   )
//
//   console.log('Saved PCM file:', pcmPath)
//   console.log('Saved WAV file:', wavPath)
//   try {
//     console.timeEnd('Performance')
//     const response = await client.speechToText.convert({
//       file: createReadStream(wavPath),
//       model_id: 'scribe_v1',
//     })
//
//     console.log('📝 Transcription:', response.text)
//   } catch (e) {
//     console.error(e)
//   }
// })

socket.on('speech:recording:data:end', async (data) => {
  console.time('Performance')

  const buffer = Buffer.concat(data)
  const audioStream = Readable.from([buffer])
  const pcmPath = resolve('recording.pcm')
  const wavPath = resolve('recording.wav')

  writeFileSync(pcmPath, buffer)
  audioStream.pipe(
    new FileWriter(wavPath, {
      sampleRate: 16000,
      channels: 1,
    }),
  )

  console.log('Saved PCM file:', pcmPath)
  console.log('Saved WAV file:', wavPath)
  try {
    console.timeEnd('Performance')
    const stream = await client.speechToSpeech.convertAsStream(
      'JBFqnCBsd6RMkjVDRZzb',
      {
        audio: createReadStream(wavPath),
        output_format: 'mp3_44100_128',
        model_id: 'eleven_multilingual_sts_v2',
      },
    )
    stream.pipe(createWriteStream('output.mp3'))
  } catch (e) {
    console.error(e)
  }
})

// Listen for events from the WebSocket server
socket.on('connect', () => {
  console.log('Connected to WebSocket server on port 7071')
})

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server on port 7071')
})
