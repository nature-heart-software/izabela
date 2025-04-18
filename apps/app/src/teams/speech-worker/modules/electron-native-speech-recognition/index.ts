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
      let ending = false
      let endingChunksCount = 0

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

      return {
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
