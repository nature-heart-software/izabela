/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
import { watch } from 'vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import googleCloudSpeechRecognition from './google-cloud-speech.ts'
import nodeRecorder from 'node-record-lpcm16'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils.ts'
import { useSettingsStore } from '@/features/settings/store'
// import customSpeechRecognition from './custom.ts'

export default () => {
  console.log('Starting native speech recognition...')

  const settingsStore = useSettingsStore()
  const speechRecognitionStore = useSpeechRecognitionStore()
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
  const context = {
    recorder,
    recorderStream,
  }
  const speechRecognitionEngine = googleCloudSpeechRecognition(context)
  // const speechRecognitionEngine = customSpeechRecognition(context)

  const stopWatch = watch(
    () => speechRecognitionStore.recording,
    () => {
      if (speechRecognitionStore.recording) {
        speechRecognitionEngine.startStream()
      } else {
        speechRecognitionEngine.stopStream()
      }
    },
  )
  return () => {
    console.log('Stopping native speech recognition...')
    speechRecognitionEngine.cleanup()
    stopWatch()
  }
}
