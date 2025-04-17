import { useSettingsStore } from '@/features/settings/store'
import speech from '@google-cloud/speech'
import { v4 as uuid } from 'uuid'
import { Deferred } from '@packages/toolbox'
import { Writable } from 'stream'
import { ipcMain } from 'electron-postman'
import takeRight from 'lodash/takeRight'

export default ({ recorder, recorderStream }: any) => {
  const settingsStore = useSettingsStore()
  const encoding = 'LINEAR16'
  const sampleRateHertz = 16000
  const languageCode = settingsStore.speechInputLanguage
  const maxEndingChunksCount = settingsStore.soxPostRecordingChunks
  const client = new speech.v1p1beta1.SpeechClient()

  let rollingBuffer: any[] = []
  const pendingMessages: {
    id: string
    end: () => void
    message: Promise<string>
    currentTranscript: string
    resolve: (message: string) => void
    reject: (err: Error) => void
  }[] = []

  function recorderCleanup() {
    recorder?.stop()
  }

  function startStream() {
    const id = uuid()
    const deferredMessage = Deferred<string>()
    let currentTranscript = ''
    let ending = false
    let endingChunksCount = 0

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
      .on('error', onRecognizeStreamError)
      .on('data', onRecognizeStreamData)

    function onRecognizeStreamError(err: Error) {
      console.error(`API request error ${err}`)
      deferredMessage.resolve('')
    }

    function onRecognizeStreamData(res: any) {
      currentTranscript = res.results[0]?.alternatives[0].transcript
      if (res.results[0]?.isFinal) {
        deferredMessage.resolve(res.results[0].alternatives[0].transcript)
        stream.removeListener('data', onRecognizeStreamData)
        stream.removeListener('error', onRecognizeStreamError)
      }
    }

    const transformer = new Writable({
      write(chunk, _encoding, next) {
        stream.write(chunk)
        if (ending) {
          endingChunksCount += 1
          if (endingChunksCount >= maxEndingChunksCount) {
            onEnded()
          }
        }
        next()
      },
    })

    function onEnded() {
      recorderStream?.unpipe(transformer)
      stream.end()
      setTimeout(() => {
        // automatically resolve if nothing was recognized after some time
        if (!currentTranscript) {
          deferredMessage.resolve('')
          const index = pendingMessages.findIndex((m) => m.id === id)
          if (index >= 0) {
            pendingMessages.splice(index, 1)
          }
        }
      }, 1000)
    }

    rollingBuffer.forEach((item) => {
      stream.write(item)
    })

    recorderStream?.pipe(transformer)

    deferredMessage.promise.then((message) => {
      const messageWithoutProfanityFilter = message.replace(/\*/g, '-')
      const pendingMessage = pendingMessages.find((m) => m.id === id)
      if (pendingMessage) {
        const index = pendingMessages.indexOf(pendingMessage)
        if (pendingMessages[index - 1]) {
          pendingMessages[index - 1].message.then(() => {
            if (messageWithoutProfanityFilter)
              ipcMain.sendTo(
                'speech-worker',
                'say',
                messageWithoutProfanityFilter,
              )
            pendingMessages.splice(pendingMessages.indexOf(pendingMessage), 1)
          })
          // if previous stream failed because nothing was recognized, resolve it
          if (!pendingMessages[index - 1].currentTranscript) {
            pendingMessages[index - 1].resolve('')
            pendingMessages.splice(index - 1, 1)
          }
        } else {
          if (messageWithoutProfanityFilter)
            ipcMain.sendTo(
              'speech-worker',
              'say',
              messageWithoutProfanityFilter,
            )
          pendingMessages.splice(pendingMessages.indexOf(pendingMessage), 1)
        }
      }
    })

    pendingMessages.push({
      id,
      end: () => {
        ending = true
      },
      message: deferredMessage.promise,
      resolve: deferredMessage.resolve,
      reject: deferredMessage.reject,
      currentTranscript,
    })
  }

  function stopStream() {
    rollingBuffer = []
    pendingMessages[pendingMessages.length - 1]?.end()
  }

  recorderStream.on('data', (chunk: any) => {
    rollingBuffer = takeRight(
      [...rollingBuffer, chunk],
      settingsStore.soxPreRecordingChunks,
    )
  })

  return {
    startStream,
    stopStream,
    cleanup() {
      recorderCleanup()
      client.close()
    },
  }
}
