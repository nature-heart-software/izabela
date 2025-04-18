import { useSettingsStore } from '@/features/settings/store'
import speech from '@google-cloud/speech'
import once from 'lodash/once'

export default ({ useRecording, sampleRateHertz }: any) => {
  const settingsStore = useSettingsStore()
  const encoding = 'LINEAR16'
  const languageCode = settingsStore.speechInputLanguage
  const client = new speech.v1p1beta1.SpeechClient()

  function startStream() {
    let currentTranscript = ''
    const stream = client
      .streamingRecognize({
        config: {
          encoding,
          sampleRateHertz,
          languageCode,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true,
          profanityFilter: settingsStore.speechProfanityFilter,
        },
        singleUtterance: true,
        interimResults: true,
      })
      .on('data', onData)
      .on('error', onError)
      .on('end', onEnd)
      .on('close', onClose)

    const recording = useRecording({
      onChunk(chunk: any) {
        stream.write(chunk)
      },
      onEnded() {
        stream.end()
      },
    })

    const cleanup = once(() => {
      recording.stopPumping()
      stream.removeAllListeners()
      stream.end()
    })

    function onData(res: any) {
      currentTranscript = res.results[0]?.alternatives[0].transcript
      if (res.results[0]?.isFinal) {
        recording.resolve(res.results[0].alternatives[0].transcript)
        cleanup()
      }
    }

    function onError() {
      recording.resolve('')
      cleanup()
    }

    function onEnd() {
      if (currentTranscript) {
        recording.resolve('')
        cleanup()
      }
      setTimeout(() => {
        recording.resolve('')
        cleanup()
      }, 1000)
    }

    function onClose() {
      recording.resolve('')
      cleanup()
    }

    recording.startPumping()
  }

  function stopStream() {}

  return {
    startStream,
    stopStream,
    cleanup() {
      client.close()
    },
  }
}
