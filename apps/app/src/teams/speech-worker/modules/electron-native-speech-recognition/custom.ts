import { useSettingsStore } from '@/features/settings/store'
import io from 'socket.io-client'

export default ({ useRecording, sampleRateHertz }: any) => {
  const settingsStore = useSettingsStore()
  const socket = io(`ws://localhost:7071`)

  return {
    startStream() {
      const fullAudioChunks: any[] = []

      const recording = useRecording({
        onChunk(chunk: any) {
          fullAudioChunks.push(chunk)
          socket.emit('speech:recording:data:chunk', chunk)
        },
        onEnded() {
          socket.emit('speech:recording:data:end', fullAudioChunks)
        },
      })

      socket.emit('speech:recording:data:start', {
        sampleRateHertz,
        language: settingsStore.speechInputLanguage,
        speechRecognitionStrategy: settingsStore.speechRecognitionStrategy,
      })

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
