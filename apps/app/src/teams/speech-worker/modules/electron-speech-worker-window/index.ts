// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import speech from '@google-cloud/speech'
import { BrowserWindow } from 'electron'
import { ipcMain } from 'electron-postman'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { createNotification } from '@/utils/electron-notification'
import { useSpeechStore } from '@/features/speech/store'
import { gkl, keybindingReleased, keybindingTriggered } from '@/modules/electron-keybinding/utils'
import { Deferred } from '@packages/toolbox'
import { useSettingsStore } from '@/features/settings/store'
import { watch } from 'vue'
import electronNodeSpeechRecognition from '@/teams/speech-worker/modules/electron-node-speech-recognition'

export const ElectronSpeechWindow = () => {
  let registeredWindow: BrowserWindow | null = null
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let speechStore: ReturnType<typeof useSpeechStore> | undefined
  let deferredRecording: ReturnType<typeof Deferred> | null = null
  let electronNodeSpeechRecognitionCallback: ReturnType<
    typeof electronNodeSpeechRecognition
  > | null = null

  const onListeningError = () => {
    createNotification({
      body: "Sorry, I didn't catch that..\nCould you say that again please?",
      silent: true,
    }).show()
  }

  const transcribeAudio = async ({
    content,
    sampleRate,
    encoding,
  }: {
    content: string
    sampleRate: number
    encoding: any
  }) => {
    if (!speechStore) return
    try {
      const client = new speech.SpeechClient()
      const engine = speechStore.currentSpeechEngine

      const request = {
        config: {
          encoding,
          sampleRateHertz: sampleRate,
          languageCode: engine?.getLanguageCode() || DEFAULT_LANGUAGE_CODE,
        },
        audio: {
          content,
        },
      }

      const [operation] = await client.longRunningRecognize(request)
      const [response]: any = await operation.promise()
      const transcription = response.results
        .map((result: any) => result.alternatives[0].transcript)
        .join('\n')
      if (transcription) {
        ipcMain.sendTo('speech-worker', 'say', transcription)
      } else {
        onListeningError()
      }
    } catch (e: unknown) {
      onListeningError()
    }
  }
  const addEventListeners = () => {
    gkl.addListener((e) => {
      if (
        settingsStore &&
        e.state === 'DOWN' &&
        !deferredRecording &&
        keybindingTriggered(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording = Deferred()
        ipcMain.sendTo('speech-worker', 'start-speech-transcription')
      }
    })

    gkl.addListener((e) => {
      if (
        settingsStore &&
        e.state === 'UP' &&
        deferredRecording &&
        keybindingReleased(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording.resolve(true)
        deferredRecording = null
        ipcMain.sendTo('speech-worker', 'stop-speech-transcription')
      }
    })
  }

  isReady().then(() => {
    console.log('electron speech worker window ready')
    settingsStore = useSettingsStore()
    speechStore = useSpeechStore()

    watch(
      () => [
        settingsStore?.speechRecordingStrategy,
        settingsStore?.speechPostrecordTime,
        settingsStore?.enableSTTTS,
        speechStore?.currentSpeechEngine,
      ],
      () => {
        if (electronNodeSpeechRecognitionCallback) {
          electronNodeSpeechRecognitionCallback()
        }
        if (
          settingsStore?.enableSTTTS &&
          settingsStore.speechRecordingStrategy === 'continuous-node'
        ) {
          electronNodeSpeechRecognitionCallback = electronNodeSpeechRecognition()
        }
      },
      { deep: true, immediate: true },
    )
  })

  const start = (window: BrowserWindow) => {
    registeredWindow = window
    ready.resolve(window)
    addEventListeners()
  }

  return {
    start,
    transcribeAudio,
  }
}

export default ElectronSpeechWindow()
