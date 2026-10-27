import once from 'lodash/once'
import { Buffer } from 'buffer'
import { WebSocket } from 'ws'
import { useSettingsStore } from '@/features/settings/store'
import { WebSocketSessionManager } from '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts'
import { store } from './store.ts'
import engine from './register.node.ts'

export default ({ useRecording }: any) => {
  if (!engine.hasCredentials()) return
  const { apiKey } = engine.getCredentials()
  const manager = new WebSocketSessionManager({
    sessionMaxAge: 30 * 60 * 1000,
    async factory() {
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?intent=transcription',
        {
          headers: {
            Authorization: 'Bearer ' + apiKey,
          },
        },
      )

      ws.on('open', function open() {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              type: 'transcription',
              audio: {
                input: {
                  format: { type: 'audio/pcm', rate: 24000 },
                  transcription: {
                    model: store.getProperty('model'),
                    prompt: store.getProperty('prompt'),
                    language: settingsStore.speechInputLanguage.split('-')[0],
                  },
                  // The application already detects turns (Hark or hold-to-record).
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

  const settingsStore = useSettingsStore()

  return {
    async startStream() {
      const ws = (manager.getActiveSession() || (await manager.ready))?.socket
      if (!ws) return
      ws.on('close', onClose)
      ws.on('error', onError)
      ws.on('message', onMessage)
      let ended = false

      const recording = useRecording({
        onChunk(chunk: any) {
          if (!ended && ws.readyState === WebSocket.OPEN) {
            const base64Audio = Buffer.from(chunk).toString('base64')
            const event = {
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }
            ws.send(JSON.stringify(event))
          }
        },
        onEnded() {
          if (!ended && ws.readyState === WebSocket.OPEN)
            ws.send(
              JSON.stringify({
                type: 'input_audio_buffer.commit',
              }),
            )
        },
      })

      const resolve = once((text: string = '') => {
        recording.resolve(text)
        ended = true
        recording.stopPumping()
        ws.off('close', onClose)
        ws.off('error', onError)
        ws.off('message', onMessage)
        if (ws.readyState === WebSocket.OPEN)
          ws.send(
            JSON.stringify({
              type: 'input_audio_buffer.clear',
            }),
          )
      })

      function onMessage(message: any) {
        const msg = JSON.parse(message.toString())
        if (
          msg.type === 'conversation.item.input_audio_transcription.completed'
        ) {
          const transcript = msg.transcript
          if (transcript) resolve(transcript)
        }
        if (msg.type === 'error') {
          console.error('OpenAI transcription failed', msg.error?.message)
          resolve()
        }
      }

      function onClose() {
        resolve()
      }

      function onError() {
        resolve()
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {
      manager.stop()
    },
  }
}
