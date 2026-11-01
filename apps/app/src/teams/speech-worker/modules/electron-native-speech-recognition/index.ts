/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
import { watch } from 'vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import nodeRecorder from 'node-record-lpcm16'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import { useSettingsStore } from '@/features/settings/store'
import takeRight from 'lodash/takeRight'
import { v4 as uuid } from 'uuid'
import { Deferred } from '@packages/toolbox'
import { ipcMain } from 'electron-postman'
import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'

export default () => {
  console.log('Starting native speech recognition...')

  const settingsStore = useSettingsStore()
  const speechRecognitionStore = useSpeechRecognitionStore()

  const isVAD = settingsStore.speechRecognitionStrategy === 'continuous'
  const preRecordingChunksCount = isVAD
    ? settingsStore.soxPreRecordingChunks
    : 0
  const postRecordingChunksCount = isVAD
    ? settingsStore.soxPostRecordingChunks
    : 0
  const selectedEngine = speechRecognitionEngineManager.getEngineById(
    settingsStore.selectedSpeechRecognitionEngine,
  )
  const sampleRateHertz = selectedEngine?.sampleRateHertz || 16000

  const recorder = nodeRecorder.record({
    sampleRate: sampleRateHertz,
    recorder: 'sox',
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
      preRecordingChunksCount,
    )
  })

  const pendingMessages = new Map()
  let disposed = false
  const pumps = new Set<(chunk: any) => void>()

  const context = {
    recorder,
    recorderStream,
    sampleRateHertz,
    useRecording({
      onEnded,
      onChunk,
      clearOnEnd,
    }: {
      queueMessages?: boolean
      clearOnEnd?: boolean
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
        if (!disposed && messageWithoutProfanityFilter) {
          ipcMain.sendTo('speech-worker', 'say', messageWithoutProfanityFilter)
        }
        pendingMessages.delete(id)
        deferredDone.resolve(messageWithoutProfanityFilter)
      })

      function onData(chunk: any) {
        if (disposed) return
        onChunk(chunk)
        if (ending) {
          endingChunksCount += 1
          if (endingChunksCount >= postRecordingChunksCount) {
            recorderStream?.off('data', onData)
            pumps.delete(onData)
            onEnded?.()
          }
        }
      }

      function startPumping() {
        if (disposed || pumps.has(onData)) return
        pumps.add(onData)
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
          if (clearOnEnd) {
            pendingMessages.delete(id)
          }
        },
        done: deferredDone.promise,
        cancel: () => {
          deferredMessage.resolve('')
          deferredDone.resolve('')
        },
      })

      return {
        resolve(message: string) {
          recorderStream.off('data', onData)
          pumps.delete(onData)
          deferredMessage.resolve(message)
        },
        startPumping,
        stopPumping,
      }
    },
  }

  const speechRecognitionEngine = selectedEngine?.recognitionFn?.(context)

  const stopWatch = watch(
    () => speechRecognitionStore.recording,
    () => {
      if (speechRecognitionStore.recording) {
        Promise.resolve()
          .then(() => {
            if (!disposed) return speechRecognitionEngine?.startStream?.()
          })
          .catch((error) =>
            console.error('Unable to start speech recognition', error),
          )
      } else {
        speechRecognitionEngine?.stopStream?.()
        // console.log(Array.from(pendingMessages.values()).map((m) => m.id))
        pendingMessages.forEach((pendingMessage) => pendingMessage.end())
        rollingBuffer = []
      }
    },
    { immediate: true },
  )

  return () => {
    if (disposed) return
    disposed = true
    console.log('Stopping native speech recognition...')
    stopWatch()
    pumps.forEach((pump) => recorderStream.off('data', pump))
    pumps.clear()
    pendingMessages.forEach((message) => message.cancel())
    pendingMessages.clear()
    recorder.stop()
    speechRecognitionEngine?.cleanup?.()
  }
}
