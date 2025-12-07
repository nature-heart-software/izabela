const express = require('express')
const pkg = require('./package.json')
const cors = require('cors')
const bodyParser = require('body-parser')
const io = require('socket.io-client')
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js')
const { writeFileSync } = require('node:fs')
const StreamManager = require('./stream-manager')
const { resolve, join } = require('node:path')
const { mkdirSync } = require('fs')
import * as path from 'path'

const streamManager = new StreamManager()

function createWavBuffer(pcmData, sampleRate, channels) {
  const dataSize = pcmData.length
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * 2, 28)
  header.writeUInt16LE(channels * 2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmData])
}

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
  try {
    const date = new Date()
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')
    const uniqueSuffix = Math.random().toString(36).substring(2, 10)
    const id = `${date}-${uniqueSuffix}`
    const pcmPath = resolve(`./outputs/${id}.pcm`)
    const wavPath = resolve(`./outputs/${id}.wav`)

    const pcmBuffer = Buffer.concat(data)
    const wavBuffer = createWavBuffer(pcmBuffer, 16000, 1)

    mkdirSync(path.dirname(pcmPath), { recursive: true })
    mkdirSync(path.dirname(wavPath), { recursive: true })
    writeFileSync(pcmPath, pcmBuffer)
    writeFileSync(wavPath, wavBuffer)

    /* Uncomment this if you want Izabela to play the message with the active tts engine */
    // const response = await client.speechToText.convert({
    //   file: createReadStream(wavPath),
    //   model_id: 'scribe_v1',
    //   tag_audio_events: false,
    // })
    //
    // console.log('Transcription:', response.text)
    //
    // socket.emit('say', response.text)
  } catch (e) {
    console.error(e)
  }
})

socket.on('speech:recording:data:end', async (data) => {
  try {
    const date = new Date()
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')
    const uniqueSuffix = Math.random().toString(36).substring(2, 10)
    const id = `${date}-${uniqueSuffix}`
    const pcmPath = resolve(`./outputs/${id}.pcm`)
    const wavPath = resolve(`./outputs/${id}.wav`)

    const pcmBuffer = Buffer.concat(data)
    const wavBuffer = createWavBuffer(pcmBuffer, 16000, 1)

    mkdirSync(path.dirname(pcmPath), { recursive: true })
    mkdirSync(path.dirname(wavPath), { recursive: true })
    writeFileSync(pcmPath, pcmBuffer)
    writeFileSync(wavPath, wavBuffer)

    /* Uncomment this if you want to play a specific audio */
    // const stream = await client.speechToSpeech.convertAsStream(
    //   'JBFqnCBsd6RMkjVDRZzb',
    //   {
    //     audio: createReadStream(wavPath),
    //     output_format: 'mp3_44100_128',
    //     model_id: 'eleven_multilingual_sts_v2',
    //     remove_background_noise: true,
    //   },
    // )
    //
    // stream.pipe(streamManager.createStream(id))
    //
    // const endpoint = `${ENDPOINT_BASE_URL}:${ENDPOINT_PORT}/play/${id}`
    //
    // console.log('Generated endpoint:', endpoint)
    //
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
