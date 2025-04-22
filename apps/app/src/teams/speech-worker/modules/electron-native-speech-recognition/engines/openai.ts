import once from 'lodash/once'
import { Buffer } from 'node:buffer'

import WebSocket from 'ws'
import { openaiSpeechRecognitionPlugin } from '@/features/speech/store/plugins/openai.ts'
import { useSettingsStore } from '@/features/settings/store'

export default ({ useRecording }: any) => {
  const settingsStore = useSettingsStore()

  const url = 'wss://api.openai.com/v1/realtime?intent=transcription'
  let ws: WebSocket

  function refreshWSSession() {
    ws = new WebSocket(url, {
      headers: {
        Authorization:
          'Bearer ' + openaiSpeechRecognitionPlugin.getProperty('apiKey', true),
        'OpenAI-Beta': 'realtime=v1',
      },
    })

    ws.on('open', function open() {
      console.log('Connected to server.')
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

    ws.on('message', (message) => {
      const msg = JSON.parse(message)
      console.log('Received message from server.', msg)
      if (msg.type === 'transcription_session.created') {
        const expiresAt = msg.session.expires_at * 1000
        const now = new Date().getTime()
        const expiresFromNow = expiresAt - now
        setTimeout(() => {
          ws.close()
          refreshWSSession()
        }, expiresFromNow)
      }
    })
  }

  refreshWSSession()

  return {
    startStream() {
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

      function onMessage(message) {
        const msg = JSON.parse(message.toString())
        console.log(msg)
        if (
          msg.type === 'conversation.item.input_audio_transcription.completed'
        ) {
          const transcript = msg.transcript
          if (transcript) resolve(transcript)
        }
      }

      function onClose(code, reason) {
        console.log(`WebSocket closed: ${code} — ${reason.toString()}`)
        resolve()
      }

      function onError(code, reason) {
        console.log(`WebSocket error: ${code} — ${reason.toString()}`)
        resolve()
      }

      recording.startPumping()
    },
    stopStream() {},
    cleanup() {
      ws.close()
    },
  }
}
