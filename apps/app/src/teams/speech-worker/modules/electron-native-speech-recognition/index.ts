/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
// import { watch } from 'vue'
// import { useSpeechRecognitionStore } from '@/features/speech/store'
// import googleCloudSpeechRecognition from './google-cloud-speech.ts'

export default () => {
  console.log('Starting native speech recognition...')
  // const speechRecognitionEngine = googleCloudSpeechRecognition()
  // // const speechRecognitionEngine = customSpeechRecognition()
  // const speechRecognitionStore = useSpeechRecognitionStore()
  // const stopWatch = watch(
  //   () => speechRecognitionStore.recording,
  //   () => {
  //     if (speechRecognitionStore.recording) {
  //       // googleCloudSpeech.startStream()
  //       speechRecognitionEngine.startStream()
  //     } else {
  //       // googleCloudSpeech.stopStream()
  //       speechRecognitionEngine.stopStream()
  //     }
  //   },
  // )
  return () => {
    console.log('Stopping native speech recognition...')
    // // googleCloudSpeech.cleanup()
    // speechRecognitionEngine.cleanup()
    // stopWatch()
  }
}
