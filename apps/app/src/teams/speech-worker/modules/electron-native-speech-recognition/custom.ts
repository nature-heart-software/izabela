import { useSettingsStore } from '@/features/settings/store'
import io from 'socket.io-client'

export default ({ rollingBuffer, useRecording, sampleRateHertz }: any) => {
  const settingsStore = useSettingsStore()
  const socket = io(`ws://localhost:7071`)

  return {
    startStream() {
      const fullAudioChunks: any[] = []

      rollingBuffer.forEach((chunk: any) => {
        fullAudioChunks.push(chunk)
      })

      const recording = useRecording({
        onChunk(chunk: any) {
          socket.emit('speech:recording:data:chunk', chunk)
        },
        onEnded() {
          socket.emit('speech:recording:data:end', fullAudioChunks)
        },
      })

      socket.emit('speech:recording:settings', {
        sampleRateHertz,
        language: settingsStore.speechInputLanguage,
        speechRecognitionStrategy: settingsStore.speechRecognitionStrategy,
      })

      socket.emit('speech:recording:data:start', recording.rollingBuffer)
    },
    stopStream() {},
    cleanup() {},
  }
}
