import { useSettingsStore } from '@/features/settings/store'
import io from 'socket.io-client'
import engine from './register.node.ts'

export default ({ recorder, useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const settingsStore = useSettingsStore()
  const socket = io(`ws://localhost:7071`)

  return {
    startStream() {
      const audioChunks: any[] = []

      const recording = useRecording({
        clearOnEnd: true,
        onChunk(chunk: any) {
          audioChunks.push(chunk)
          socket.emit('speech:recording:data:chunk', chunk)
        },
        onEnded() {
          socket.emit('speech:recording:data:end', audioChunks)
        },
      })

      socket.emit('speech:recording:data:start', {
        ...recorder.options,
        language: settingsStore.speechInputLanguage,
        speechRecognitionStrategy: settingsStore.speechRecognitionStrategy,
      })

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {},
  }
}
