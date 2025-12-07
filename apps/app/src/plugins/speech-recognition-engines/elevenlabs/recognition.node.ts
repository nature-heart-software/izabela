import once from 'lodash/once'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import path from 'path'
import { app } from 'electron'
import pkg from '@root/package.json'
import { createReadStream, mkdirSync, unlink, writeFileSync } from 'fs'

import { v4 as uuid } from 'uuid'
import { promisify } from 'util'
import engine from './register.node.ts'

const unlinkAsync = promisify(unlink)

function createWavBuffer(
  pcmData: Buffer,
  sampleRate: number,
  channels: number,
): Buffer {
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

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey } = engine.getCredentials()
  const client = new ElevenLabsClient({
    apiKey,
  })

  return {
    startStream() {
      let streamEnded = false
      const audioChunks: any[] = []

      const wavPath = path.join(
        app.getPath('temp'),
        pkg.productName,
        'cache',
        `${uuid()}.wav`,
      )

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!streamEnded) {
            audioChunks.push(chunk)
          }
        },
        onEnded() {
          onRecordingEnd()
        },
      })

      const resolve = once((text = '') => {
        recording.resolve(text)
        streamEnded = true
        recording.stopPumping()
        unlinkAsync(wavPath).catch(() => {})
      })

      async function onRecordingEnd() {
        try {
          const pcmData = Buffer.concat(audioChunks)
          const wavBuffer = createWavBuffer(pcmData, 16000, 1)

          mkdirSync(path.dirname(wavPath), { recursive: true })
          writeFileSync(wavPath, wavBuffer)

          const response = await client.speechToText.convert({
            file: createReadStream(wavPath),
            modelId: 'scribe_v1',
            tagAudioEvents: false,
          })

          if ('text' in response) {
            resolve(response.text)
          } else {
            resolve()
          }
        } catch (err) {
          resolve()
        }
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
