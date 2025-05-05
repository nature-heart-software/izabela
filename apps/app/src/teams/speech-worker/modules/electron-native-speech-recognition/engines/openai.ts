import once from 'lodash/once'
import { Buffer } from 'buffer'
import { store } from '@/plugins/speech-recognition-engines/openai-speech-recognition/store'
import WebSocket from 'ws'
import { useSettingsStore } from '@/features/settings/store'
import { WebSocketSessionManager } from '@/teams/speech-worker/modules/electron-native-speech-recognition/websocket-session-manager.ts'

export default ({ useRecording }: any) => {
  const manager = new WebSocketSessionManager({
    sessionMaxAge: 30 * 60 * 1000,
    async factory() {
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?intent=transcription',
        {
          headers: {
            Authorization:
              'Bearer ' +
              store.getProperty('apiKey', true),
            'OpenAI-Beta': 'realtime=v1',
          },
        },
      )

      ws.on('open', function open() {
        ws.send(
          JSON.stringify({
            type: 'transcription_session.update',
            session: {
              input_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'gpt-4o-transcribe',
                prompt: '',
                language: settingsStore.speechInputLanguage.split('-')[0],
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 200,
              },
              input_audio_noise_reduction: {
                type: 'near_field',
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
      const ws = manager.getActiveSession()?.socket
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
