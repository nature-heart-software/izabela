import once from 'lodash/once'
import { ElevenLabsClient } from 'elevenlabs'
import path from 'path'
import { app } from 'electron'
import pkg from '@root/package.json'
import { createReadStream, unlink } from 'fs'

import buffer from 'buffer'
import { v4 as uuid } from 'uuid'
import { Readable } from 'stream'
import { FileWriter } from 'wav'
import { promisify } from 'util'
import engine from './register.node.ts'

const unlinkAsync = promisify(unlink)

globalThis.Blob = (buffer as any).Blob

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
        const buffer = Buffer.concat(audioChunks)
        const audioStream = Readable.from([buffer])
        try {
          audioStream
            .pipe(
              new FileWriter(wavPath, {
                sampleRate: 16000,
                channels: 1,
              }),
            )
            .on('finish', () => {
              client.speechToText
                .convert({
                  file: createReadStream(wavPath),
                  model_id: 'scribe_v1',
                  tag_audio_events: false,
                })
                .then((response) => {
                  resolve(response.text)
                })
                .catch(() => {
                  resolve()
                })
            })
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
