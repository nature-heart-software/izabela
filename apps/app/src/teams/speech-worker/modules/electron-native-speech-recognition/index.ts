/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
import { Writable } from 'stream'
import recorder from 'node-record-lpcm16'
import speech from '@google-cloud/speech'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import { useSettingsStore } from '@/features/settings/store'
import { takeRight } from 'lodash'
import { watch } from 'vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import { Deferred } from '@packages/toolbox'
import { v4 as uuid } from 'uuid'

export default () => {
  console.log('Starting native speech recognition...')
  const settingsStore = useSettingsStore()
  const speechRecognitionStore = useSpeechRecognitionStore()
  const encoding = 'LINEAR16'
  const sampleRateHertz = 16000
  const languageCode = settingsStore.speechInputLanguage

  const client = new speech.v1p1beta1.SpeechClient()

  let audioInput: any[] = []
  let rec: ReturnType<typeof recorder> | null = null
  let recStream: any = null
  const pendingMessages: {
    id: string
    end: () => void
    message: Promise<string>
  }[] = []

  function onRecognizeStreamError(err: Error) {
    console.error(`API request error ${err}`)
  }

  const onRecorderError = (err: Error) => {
    console.error(`Audio recording error ${err}`)
  }

  function recorderCleanup() {
    rec?.stop()
    rec?.removeListener('error', onRecorderError)
  }

  function startStream() {
    const id = uuid()
    const deferredMessage = Deferred<string>()

    function onRecognizeStreamData(stream: any) {
      console.log(stream.results[0].alternatives[0].transcript)
      if (stream.results[0]?.isFinal) {
        console.log(`Final: ${stream.results[0].alternatives[0].transcript}`)
        deferredMessage.resolve(stream.results[0].alternatives[0].transcript)
      }
    }

    const stream = client
      .streamingRecognize({
        config: {
          encoding,
          sampleRateHertz,
          languageCode,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true,
        },
        singleUtterance: true,
        interimResults: true,
      })
      .on('error', onRecognizeStreamError)
      .on('data', onRecognizeStreamData)

    const transformer = new Writable({
      write(chunk, _encoding, next) {
        stream.write(chunk)
        next()
      },
    })

    audioInput.forEach((item) => {
      stream.write(item)
    })

    recStream?.pipe(transformer)

    deferredMessage.promise.then((message) => {
      const pendingMessage = pendingMessages.find((m) => m.id === id)
      if (pendingMessage) {
        const index = pendingMessages.indexOf(pendingMessage)
        if (pendingMessages[index - 1]) {
          pendingMessages[index - 1].message.then(() => {
            ipcMain.sendTo('speech-worker', 'say', message)
            pendingMessages.splice(index, 1)
          })
        } else {
          ipcMain.sendTo('speech-worker', 'say', message)
          pendingMessages.splice(index, 1)
        }
      }
    })

    pendingMessages.push({
      id,
      end: () => {
        recStream?.unpipe(transformer)
        stream.end()
        stream.removeListener('data', onRecognizeStreamData)
        stream.removeListener('error', onRecognizeStreamError)
      },
      message: deferredMessage.promise,
    })
  }

  // let endOnNextChunk = false

  function stopStream() {
    audioInput = []
    pendingMessages[pendingMessages.length - 1]?.end()
    // endOnNextChunk = true
  }

  const audioInputStreamTransform = new Writable({
    write(chunk, _encoding, next) {
      audioInput = [...takeRight(audioInput, 10), chunk]
      next()
    },
    final() {
      recorderCleanup()
    },
  })

  rec = recorder.record({
    sampleRateHertz,
    recordProgram: 'rec',
    binPath: path.join(EXTERNALS_DIR, '/sox/sox.exe'),
    // device: settingsStore.soxDevice,
  })

  recStream = rec.stream()
  recStream.on('error', onRecorderError).pipe(audioInputStreamTransform)

  watch(
    () => speechRecognitionStore.recording,
    () => {
      if (speechRecognitionStore.recording) {
        console.log(pendingMessages.length)
        startStream()
      } else {
        stopStream()
      }
    },
  )
  return () => {
    console.log('Stopping native speech recognition...')
    recorderCleanup()
    client.close()
  }
}
