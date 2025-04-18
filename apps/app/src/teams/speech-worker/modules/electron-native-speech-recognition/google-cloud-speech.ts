import { useSettingsStore } from '@/features/settings/store'
import speech from '@google-cloud/speech'
import { v4 as uuid } from 'uuid'
import { Deferred } from '@packages/toolbox'
import { ipcMain } from 'electron-postman'
import once from 'lodash/once'

export default ({ useRecording, sampleRateHertz }: any) => {
  const settingsStore = useSettingsStore()
  const encoding = 'LINEAR16'
  const languageCode = settingsStore.speechInputLanguage
  const client = new speech.v1p1beta1.SpeechClient()

  const pendingMessages = new Map()

  function startStream() {
    const id = uuid()
    const deferredMessage = Deferred<string>()
    const deferredDone = Deferred<string>()
    let currentTranscript = ''

    const cleanup = once(
      (stream: ReturnType<typeof client.streamingRecognize>) => {
        recording.stopPumping()
        stream.removeAllListeners()
        stream.end()
      },
    )

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
      .on('data', (res: any) => {
        currentTranscript = res.results[0]?.alternatives[0].transcript
        if (res.results[0]?.isFinal) {
          console.log('final')
          deferredMessage.resolve(res.results[0].alternatives[0].transcript)
          cleanup(stream)
        }
      })
      .on('error', () => {
        deferredMessage.resolve('')
        cleanup(stream)
      })
      .on('end', () => {
        if (currentTranscript) {
          deferredMessage.resolve('')
          cleanup(stream)
        }
        setTimeout(() => {
          deferredMessage.resolve('')
          cleanup(stream)
        }, 1000)
      })
      .on('close', () => {
        deferredMessage.resolve('')
        cleanup(stream)
      })

    const recording = useRecording({
      onChunk(chunk: any) {
        stream.write(chunk)
      },
      onEnded() {
        stream.end()
      },
    })

    recording.startPumping()

    pendingMessages.set(id, {
      id,
      end: () => {
        recording.stopPumping()
      },
      done: deferredDone.promise,
    })

    deferredMessage.promise.then(async (message) => {
      const messageWithoutProfanityFilter = message.replace(/\*/g, '-')
      const pendingMessage = pendingMessages.get(id)
      if (pendingMessage) {
        const values = Array.from(pendingMessages.values())
        const index = values.indexOf(pendingMessage)
        const previousPendingMessage = values[index - 1]
        if (previousPendingMessage) {
          await previousPendingMessage.done
        }
      }
      if (messageWithoutProfanityFilter) {
        ipcMain.sendTo('speech-worker', 'say', messageWithoutProfanityFilter)
      }
      pendingMessages.delete(id)
      deferredDone.resolve(messageWithoutProfanityFilter)
    })
  }

  function stopStream() {
    pendingMessages.forEach((pendingMessage) => pendingMessage.end())
  }

  return {
    startStream,
    stopStream,
    cleanup() {
      client.close()
    },
  }
}
