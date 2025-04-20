import once from 'lodash/once'
import { ElevenLabsClient } from 'elevenlabs'
import path from 'path'
import { app } from 'electron'
import pkg from '@root/package.json'
import { createReadStream, unlink } from 'node:fs'

import { Blob } from 'buffer'
import { v4 as uuid } from 'uuid'
import { Readable } from 'node:stream'
import { FileWriter } from 'wav'
import { promisify } from 'node:util'
import { elevenlabsSpeechRecognitionPlugin } from '@/features/speech/store/plugins/elevenlabs'

const unlinkAsync = promisify(unlink)

globalThis.Blob = Blob

export default ({ useRecording }: any) => {
  const client = new ElevenLabsClient({
    apiKey: elevenlabsSpeechRecognitionPlugin.getProperty('apiKey', true),
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

      const cleanup = once(() => {
        streamEnded = true
        recording.stopPumping()
        unlinkAsync(wavPath).catch(() => {})
      })

      async function onRecordingEnd() {
        const buffer = Buffer.concat(audioChunks)
        const audioStream = Readable.from([buffer])
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
                recording.resolve(response.text)
              })
              .catch(() => {
                recording.resolve('')
              })
              .finally(() => {
                cleanup()
              })
          })
        
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
