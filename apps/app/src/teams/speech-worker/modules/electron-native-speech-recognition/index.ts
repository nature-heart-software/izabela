/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
import { watch } from 'vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import googleCloudSpeechRecognition from './google-cloud-speech.ts'
import nodeRecorder from 'node-record-lpcm16'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import { useSettingsStore } from '@/features/settings/store'
import takeRight from 'lodash/takeRight'
import customSpeechRecognition from './custom.ts'
import { v4 as uuid } from 'uuid'
import { Deferred } from '@packages/toolbox'
import { ipcMain } from 'electron-postman'

export default () => {
  console.log('Starting native speech recognition...')

  const settingsStore = useSettingsStore()
  const speechRecognitionStore = useSpeechRecognitionStore()

  const maxEndingChunksCount = settingsStore.soxPostRecordingChunks
  const sampleRateHertz = 16000

  const recorder = nodeRecorder.record({
    sampleRateHertz,
    recordProgram: 'rec',
    binPath: path.join(EXTERNALS_DIR, '/sox/sox.exe'),
    device: settingsStore.soxDevice,
    audioType: 'raw',
  })

  const recorderStream = recorder.stream()

  recorderStream.on('error', (err: Error) => {
    console.error(`Audio recording error ${err}`)
  })

  let rollingBuffer: any[] = []

  recorderStream.on('data', (chunk: any) => {
    rollingBuffer = takeRight(
      [...rollingBuffer, chunk],
      settingsStore.soxPreRecordingChunks,
    )
  })

  const pendingMessages = new Map()

  const context = {
    recorder,
    recorderStream,
    sampleRateHertz,
    useRecording({
      onEnded,
      onChunk,
    }: {
      onChunk: (chunk: any) => void
      onEnded?: () => void
    }) {
      const id = uuid()
      const deferredMessage = Deferred<string>()
      const deferredDone = Deferred<string>()
      let ending = false
      let endingChunksCount = 0

      deferredMessage.promise.then(async (message) => {
        const messageWithoutProfanityFilter = message.replace(/\*/g, '-')
        const pendingMessage = pendingMessages.get(id)
        if (pendingMessage) {
          const values = Array.from(pendingMessages.values())
          const index = values.indexOf(pendingMessage)
          const previousPendingMessage = values[index - 1]
          if (previousPendingMessage) {
            await previousPendingMessage.done
          }
        }
        if (messageWithoutProfanityFilter) {
          ipcMain.sendTo('speech-worker', 'say', messageWithoutProfanityFilter)
        }
        pendingMessages.delete(id)
        deferredDone.resolve(messageWithoutProfanityFilter)
      })

      function onData(chunk: any) {
        onChunk(chunk)
        if (ending) {
          endingChunksCount += 1
          if (endingChunksCount >= maxEndingChunksCount) {
            recorderStream?.off('data', onData)
            onEnded?.()
          }
        }
      }

      function startPumping() {
        recorderStream.on('data', onData)
        rollingBuffer.forEach((chunk) => {
          onChunk(chunk)
        })
      }

      function stopPumping() {
        ending = true
      }

      pendingMessages.set(id, {
        id,
        end: () => {
          stopPumping()
        },
        done: deferredDone.promise,
      })

      return {
        resolve(message: string) {
          deferredMessage.resolve(message)
        },
        startPumping,
        stopPumping,
      }
    },
  }

  const speechRecognitionEngine = {
    google: googleCloudSpeechRecognition,
    custom: customSpeechRecognition,
  }['google'](context)

  const stopWatch = watch(
    () => speechRecognitionStore.recording,
    () => {
      if (speechRecognitionStore.recording) {
        speechRecognitionEngine.startStream()
      } else {
        speechRecognitionEngine.stopStream()
        pendingMessages.forEach((pendingMessage) => pendingMessage.end())
        rollingBuffer = []
      }
    },
  )

  return () => {
    console.log('Stopping native speech recognition...')
    recorder.stop()
    speechRecognitionEngine.cleanup()
    stopWatch()
  }
}
