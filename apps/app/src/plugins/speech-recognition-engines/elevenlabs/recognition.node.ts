import { createRecognitionLifecycle } from '../../../modules/speech-recognition-engine-manager/lifecycle'
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
  const client = new ElevenLabsClient({ apiKey })
  const lifecycle = createRecognitionLifecycle()
  return {
    startStream() {
      if (lifecycle.stopped) return
      const audioChunks: Buffer[] = []
      const wavPath = path.join(
        app.getPath('temp'),
        pkg.productName,
        'cache',
        `${uuid()}.wav`,
      )
      const controller = new AbortController()
      let file: ReturnType<typeof createReadStream> | undefined
      const removeFile = () => {
        void unlinkAsync(wavPath).catch(() => {})
      }
      const turn = lifecycle.create({
        useRecording,
        onChunk: (chunk) => audioChunks.push(Buffer.from(chunk)),
        async onEnded() {
          const wavBuffer = createWavBuffer(
            Buffer.concat(audioChunks),
            16000,
            1,
          )
          mkdirSync(path.dirname(wavPath), { recursive: true })
          writeFileSync(wavPath, wavBuffer)
          file = createReadStream(wavPath)
          file.on('error', () => turn.finish('', 'error'))
          const response = await client.speechToText.convert(
            { file, modelId: 'scribe_v1', tagAudioEvents: false },
            { abortSignal: controller.signal },
          )
          turn.finish('text' in response ? response.text : '')
        },
        cleanup() {
          controller.abort()
          audioChunks.length = 0
          if (file && !file.closed) {
            file.once('close', removeFile)
            file.destroy()
          } else removeFile()
        },
      })
      turn.start()
    },
    stopStream() {},
    cleanup() {
      lifecycle.stop()
    },
  }
}
