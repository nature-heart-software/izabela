import { useSettingsStore } from '@/features/settings/store'
import recorder from 'node-record-lpcm16'
import { Writable } from 'stream'
import takeRight from 'lodash/takeRight'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import io from 'socket.io-client'

export default () => {
  const settingsStore = useSettingsStore()
  const sampleRateHertz = 16000
  const maxEndingChunksCount = settingsStore.soxPostRecordingChunks

  let rollingBuffer: any[] = []

  const socket = io(`ws://localhost:7071`)
  let fullAudioChunks: any[] = []
  let transformer: Writable | null = null

  const rec = recorder.record({
    sampleRateHertz,
    recordProgram: 'rec',
    binPath: path.join(EXTERNALS_DIR, '/sox/sox.exe'),
    device: settingsStore.soxDevice,
    audioType: 'raw',
  })

  const recStream = rec.stream()

  recStream.on('error', (err: Error) => {
    console.error(`Audio recording error ${err}`)
  })

  recStream.on('data', (chunk: any) => {
    rollingBuffer = takeRight(
      [...rollingBuffer, chunk],
      settingsStore.soxPreRecordingChunks,
    )

    if (transformer) {
      transformer.write(chunk)
    }
  })

  function onEnded() {
    transformer?.end()
    socket.emit('speech:recording:data:end', fullAudioChunks)
    fullAudioChunks = []
    transformer = null
  }

  let ending = false
  let endingChunksCount = 0

  function startStream() {
    ending = false
    endingChunksCount = 0
    socket.emit('speech:recording:data:start', rollingBuffer)
    transformer = new Writable({
      write(chunk, _encoding, next) {
        socket.emit('speech:recording:data:chunk', chunk)
        fullAudioChunks.push(chunk)
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
      fullAudioChunks.push(chunk)
    })
  }

  async function stopStream() {
    ending = true
  }

  return {
    startStream,
    stopStream,
    cleanup() {
      rec?.stop()
    },
  }
}
