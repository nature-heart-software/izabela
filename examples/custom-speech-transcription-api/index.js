const express = require('express')
const pkg = require('./package.json')
const cors = require('cors')
const bodyParser = require('body-parser')
const io = require('socket.io-client')
const { Readable } = require('node:stream')
const { ElevenLabsClient } = require('elevenlabs')
const { Blob } = require('buffer')
const { writeFileSync, createReadStream } = require('node:fs')
const StreamManager = require('./stream-manager')
const { resolve, join } = require('node:path')
const FileWriter = require('wav').FileWriter

const streamManager = new StreamManager()
globalThis.Blob = Blob

const socket = io(`ws://localhost:7071`)
const client = new ElevenLabsClient({
  apiKey: '',
})
// Change this depending on your environment
const ENDPOINT_BASE_URL = 'http://localhost'
const ENDPOINT_PORT = 3333
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Expose-Headers', 'Data')
  next()
})

app.listen(ENDPOINT_PORT, () => {
  console.log(
    `[${pkg.name}] API endpoint: ${ENDPOINT_BASE_URL}${
      ENDPOINT_PORT ? `:${ENDPOINT_PORT}` : ''
    }`,
  )
})

app.get('/play/:id', (req, res) => {
  const stream = streamManager.consume(req.params.id)

  if (!stream) {
    return res.status(404).send('Stream not found or already consumed')
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader(
    'Data',
    JSON.stringify({
      notice:
        'Here you can still pass data like timestamps if you have access to it',
    }),
  )

  const entry = streamManager.streams.get(req.params.id)

  if (entry && entry.done) {
    const totalSize = entry.buffer.reduce(
      (size, chunk) => size + chunk.length,
      0,
    )
    res.setHeader('Content-Length', totalSize)
  } else {
    res.setHeader('Transfer-Encoding', 'chunked')
  }

  stream.pipe(res)
})

socket.on('speech:recording:data:end', async (data) => {
  const buffer = Buffer.concat(data)
  const audioStream = Readable.from([buffer])
  const id = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  const debug = false

  if (debug) {
    const pcmPath = resolve(`./outputs/${id}.pcm`)
    const wavPath = resolve(`./outputs/${id}.wav`)

    writeFileSync(pcmPath, buffer)
    audioStream.pipe(
      new FileWriter(wavPath, {
        sampleRate: 16000,
        channels: 1,
      }),
    )
  }

  try {
    const response = await client.speechToText.convert({
      file: createReadStream(wavPath),
      model_id: 'scribe_v1',
      tag_audio_events: false,
    })

    console.log('Transcription:', response.text)

    /* Uncomment this if you want Izabela to play the message with the active tts engine */
    // socket.emit('say', response.text)
  } catch (e) {
    console.error(e)
  }
})

socket.on('speech:recording:data:end', async (data) => {
  try {
    const buffer = Buffer.concat(data)
    const audioStream = Readable.from([buffer])
    const id = new Date()
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')
    const debug = false

    if (debug) {
      const pcmPath = resolve(`./outputs/${id}.pcm`)
      const wavPath = resolve(`./outputs/${id}.wav`)

      writeFileSync(pcmPath, buffer)
      audioStream.pipe(
        new FileWriter(wavPath, {
          sampleRate: 16000,
          channels: 1,
        }),
      )
    }

    const stream = await client.speechToSpeech.convertAsStream(
      'JBFqnCBsd6RMkjVDRZzb',
      {
        audio: createReadStream(wavPath),
        output_format: 'mp3_44100_128',
        model_id: 'eleven_multilingual_sts_v2',
        remove_background_noise: true,
      },
    )

    stream.pipe(streamManager.createStream(id))

    const endpoint = `${ENDPOINT_BASE_URL}:${ENDPOINT_PORT}/play/${id}`

    console.log('Generated endpoint:', endpoint)

    /* Uncomment this if you want to play a specific audio */
    // socket.emit('audio:play', endpoint)
  } catch (e) {
    console.error(e)
  }
})

socket.on('connect', () => {
  console.log('Connected to WebSocket server on port 7071')
})

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server on port 7071')
})
