/* inspired by (stolen from) https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js */
import { Writable } from 'stream'
import recorder from 'node-record-lpcm16'
import speech, { SpeechClient } from '@google-cloud/speech'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { useSpeechStore } from '@/features/speech/store'

export default () => {
  console.log('Starting native speech recognition...')
  const speechStore = useSpeechStore()
  const engine = speechStore.currentSpeechEngine
  const encoding = 'LINEAR16'
  const sampleRateHertz = 16000
  const languageCode = engine?.getLanguageCode() || DEFAULT_LANGUAGE_CODE
  const streamingLimit = 290000 // ms - set to low number for demo purposes

  const client = new speech.v1p1beta1.SpeechClient()

  let recognizeStream: ReturnType<SpeechClient['streamingRecognize']> | null = null
  let audioInput: any[] = []
  let lastAudioInput: any[] = []
  let resultEndTime = 0
  let isFinalEndTime = 0
  let finalRequestEndTime = 0
  let newStream = true
  let bridgingOffset = 0

  const speechCallback = (stream: any) => {
    resultEndTime =
      stream.results[0].resultEndTime.seconds * 1000 +
      Math.round(stream.results[0].resultEndTime.nanos / 1000000)
    // console.log(stream.results[0].alternatives[0].transcript)
    if (stream.results[0].isFinal) {
      ipcMain.sendTo('speech-worker', 'say', stream.results[0].alternatives[0].transcript)
      audioInput = []
      isFinalEndTime = resultEndTime
    }
  }

  function startStream() {
    const config = {
      encoding,
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true,
    } as const

    const request = {
      config,
      interimResults: true,
    } as const
    audioInput = []
    recognizeStream = client
      .streamingRecognize(request)
      .on('error', (err) => {
        if ('code' in err && (err as unknown as { code: number }).code === 11) {
          // restartStream();
        } else {
          console.error(`API request error ${err}`)
        }
      })
      .on('data', speechCallback)

    setTimeout(restartStream, streamingLimit)
  }

  const audioInputStreamTransform = new Writable({
    write(chunk, _encoding, next) {
      if (newStream && lastAudioInput.length !== 0) {
        // Approximate math to calculate time of chunks
        const chunkTime = streamingLimit / lastAudioInput.length
        if (chunkTime !== 0) {
          if (bridgingOffset < 0) {
            bridgingOffset = 0
          }
          if (bridgingOffset > finalRequestEndTime) {
            bridgingOffset = finalRequestEndTime
          }
          const chunksFromMS = Math.floor((finalRequestEndTime - bridgingOffset) / chunkTime)
          bridgingOffset = Math.floor((lastAudioInput.length - chunksFromMS) * chunkTime)

          lastAudioInput.forEach((item) => {
            recognizeStream?.write(item)
          })
        }
        newStream = false
      }

      audioInput.push(chunk)

      if (recognizeStream) {
        recognizeStream.write(chunk)
      }

      next()
    },

    final() {
      if (recognizeStream) {
        recognizeStream.end()
      }
    },
  })

  function restartStream() {
    if (recognizeStream) {
      recognizeStream.end()
      recognizeStream.removeListener('data', speechCallback)
      recognizeStream = null
    }
    if (resultEndTime > 0) {
      finalRequestEndTime = isFinalEndTime
    }
    resultEndTime = 0

    lastAudioInput = []
    lastAudioInput = audioInput

    newStream = true

    startStream()
  }

  const rec = recorder.record({
    sampleRateHertz,
    recordProgram: 'rec',
    binPath: path.join(EXTERNALS_DIR, 'sox/sox.exe'),
  })

  rec
    .stream()
    .on('error', (err: Error) => {
      console.error(`Audio recording error ${err}`)
    })
    .pipe(audioInputStreamTransform)

  startStream()

  return () => {
    console.log('Stopping native speech recognition...')
    rec.stop()
    client.close()
  }
}
