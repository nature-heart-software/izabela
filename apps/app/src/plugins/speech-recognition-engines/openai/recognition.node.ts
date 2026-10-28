import once from 'lodash/once'
import { Buffer } from 'buffer'
import { WebSocket } from 'ws'
import { useSettingsStore } from '@/features/settings/store'
import { WebSocketSessionManager } from '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts'
import { store } from './store.ts'
import engine from './register.node.ts'
import { getTranscriptionOptions } from './shared.ts'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey } = engine.getCredentials()
  const settingsStore = useSettingsStore()
  const manager = new WebSocketSessionManager({
    sessionMaxAge: 30 * 60 * 1000,
    async factory() {
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?intent=transcription',
        {
          headers: { Authorization: 'Bearer ' + apiKey },
        },
      )
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              type: 'transcription',
              audio: {
                input: {
                  format: { type: 'audio/pcm', rate: 24000 },
                  transcription: getTranscriptionOptions(
                    store.getProperty('model'),
                    store.getProperty('prompt'),
                    settingsStore.speechInputLanguage.split('-')[0],
                  ),
                  turn_detection: null,
                  noise_reduction: { type: 'near_field' },
                },
              },
            },
          }),
        )
      })
      return ws
    },
  })

  return {
    async startStream() {
      let ws: WebSocket | undefined
      let ended = false
      let inputEnded = false
      let buffered: Buffer[] = []
      const sendChunk = (chunk: Buffer) => {
        if (ws?.readyState === WebSocket.OPEN)
          ws.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: chunk.toString('base64'),
            }),
          )
      }
      const commit = () => {
        if (!ended && ws?.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
      }
      // Capture immediately, including a short turn released while connecting.
      const recording = useRecording({
        onChunk(chunk: any) {
          if (ended) return
          if (!ws) buffered.push(Buffer.from(chunk))
          else sendChunk(Buffer.from(chunk))
        },
        onEnded() {
          if (inputEnded) return
          inputEnded = true
          commit()
        },
      })
      const resolve = once((text: string = '') => {
        ended = true
        buffered = []
        recording.resolve(text)
        recording.stopPumping()
        ws?.off('close', onClose)
        ws?.off('error', onClose)
        ws?.off('message', onMessage)
        if (ws?.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }))
      })
      function onMessage(message: any) {
        try {
          const msg = JSON.parse(message.toString())
          if (
            msg.type === 'conversation.item.input_audio_transcription.completed'
          )
            resolve(msg.transcript || '')
          if (msg.type === 'error') {
            console.error('OpenAI transcription failed', msg.error?.message)
            resolve()
          }
        } catch {
          resolve()
        }
      }
      function onClose() {
        resolve()
      }
      recording.startPumping()
      ws = (await manager.getSession())?.socket
      if (!ws) {
        resolve()
        return
      }
      ws.on('close', onClose)
      ws.on('error', onClose)
      ws.on('message', onMessage)
      buffered.forEach(sendChunk)
      buffered = []
      if (inputEnded) commit()
    },
    stopStream() {},
    cleanup() {
      manager.stop()
    },
  }
}
