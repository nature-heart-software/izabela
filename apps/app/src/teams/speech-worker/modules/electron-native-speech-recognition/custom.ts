import { useSettingsStore } from '@/features/settings/store'
import recorder from 'node-record-lpcm16'
import { Writable } from 'stream'
import takeRight from 'lodash/takeRight'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import io from 'socket.io-client'
import { app } from 'electron'
import fs from 'node:fs'

export default () => {
  const settingsStore = useSettingsStore()
  const sampleRateHertz = 16000
  const languageCode = settingsStore.speechInputLanguage
  const maxEndingChunksCount = settingsStore.soxPostRecordingChunks

  let audioInput: any[] = []
  let rec: ReturnType<typeof recorder> | null = null
  let recStream: any = null

  const onRecorderError = (err: Error) => {
    console.error(`Audio recording error ${err}`)
  }

  function recorderCleanup() {
    rec?.stop()
  }

  const audioInputStreamTransform = new Writable({
    write(chunk, _encoding, next) {
      audioInput = [
        ...takeRight(audioInput, settingsStore.soxPreRecordingChunks),
        chunk,
      ]
      next()
    },
    final() {
      recorderCleanup()
    },
  })

  rec = recorder.record({
    sampleRateHertz,
    recordProgram: 'rec',
    binPath: path.join(EXTERNALS_DIR, '/sox/sox.exe'),
    device: settingsStore.soxDevice,
    audioType: 'raw',
  })

  recStream = rec.stream()
  recStream.on('error', onRecorderError).pipe(audioInputStreamTransform)

  let rollingBuffer: any[] = []

  recStream.on('data', (chunk: any) => {
    rollingBuffer = [
      ...takeRight(rollingBuffer, settingsStore.soxPreRecordingChunks),
      chunk,
    ]

    if (customTransformer) {
      customTransformer.write(chunk)
    }
  })

  const socket = io(`ws://localhost:7071`)
  let customAudioChunks: any[] = []
  let customTransformer: any = null

  function onEnded() {
    customTransformer?.end()
    socket.emit('speech:recording:data:end', customAudioChunks)

    const buffer = Buffer.concat(customAudioChunks)
    const tempPath = path.join(app.getPath('userData'), 'recording.pcm')
    fs.writeFileSync(tempPath, buffer)

    // Cleanup
    customAudioChunks = []
    customTransformer = null
  }

  let ending = false
  let endingChunksCount = 0

  function startStream() {
    ending = false
    endingChunksCount = 0
    socket.emit('speech:recording:data:start', rollingBuffer)
    customTransformer = new Writable({
      write(chunk, _encoding, next) {
        socket.emit('speech:recording:data:chunk', chunk)
        customAudioChunks.push(chunk)
        if (ending) {
          endingChunksCount += 1
          if (endingChunksCount >= maxEndingChunksCount) {
            onEnded()
          }
        }
        next()
      },
    })

    rollingBuffer.forEach((chunk) => {
      customAudioChunks.push(chunk)
    })
  }

  async function stopStream() {
    ending = true
  }

  return {
    startStream,
    stopStream,
    cleanup() {
      recorderCleanup()
    },
  }
}
