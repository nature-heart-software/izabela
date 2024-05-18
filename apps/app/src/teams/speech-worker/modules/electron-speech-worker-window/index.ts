// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import speech from '@google-cloud/speech'
import { BrowserWindow, screen } from 'electron'
import { ipcMain } from 'electron-postman'
import { createNotification } from '@/utils/electron-notification'
import {
  useSpeechRecognitionStore,
  useSpeechStore,
} from '@/features/speech/store'
import {
  gkl,
  keybindingReleased,
  keybindingTriggered,
} from '@/modules/electron-keybinding/utils'
import { Deferred } from '@packages/toolbox'
import { useSettingsStore } from '@/features/settings/store'
import { watch } from 'vue'
import electronNativeSpeechRecognition from '@/teams/speech-worker/modules/electron-native-speech-recognition'
import ElectronWindowManager from '@/modules/electron-window-manager'
import mapValues from 'lodash/mapValues'
import { getTime } from '@/utils/time'
import { windowHeight, windowWidth } from '@/teams/speech-worker/electron/const'
import { getTopLeftWindow } from '@/electron/utils'

export const ElectronSpeechWindow = () => {
  let registeredWindow: BrowserWindow | null = null
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let speechStore: ReturnType<typeof useSpeechStore> | undefined
  let speechRecognitionStore:
    | ReturnType<typeof useSpeechRecognitionStore>
    | undefined
  let deferredRecording: ReturnType<typeof Deferred> | null = null
  // eslint-disable-next-line prefer-const
  let electronNativeSpeechRecognitionCallback: ReturnType<
    typeof electronNativeSpeechRecognition
  > | null = null

  const getWindow = () =>
    registeredWindow ||
    ElectronWindowManager.getInstanceByName('speech-worker')?.window
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
    if (!settingsStore) return
    try {
      const client = new speech.SpeechClient()

      const request = {
        config: {
          encoding,
          sampleRateHertz: sampleRate,
          languageCode: settingsStore.speechInputLanguage,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true,
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

  const setDisplay = () => {
    const window = getWindow()
    if (window) {
      const topLeftDisplay = getTopLeftWindow()
      window.setPosition(
        (topLeftDisplay?.bounds.x ?? 0) - windowWidth,
        (topLeftDisplay?.bounds.y ?? 0) - windowHeight,
      )
    }
  }

  const show = () => {
    const window = getWindow()
    if (window) {
      const allDisplays = screen.getAllDisplays()
      const primaryDisplay = screen.getPrimaryDisplay()
      const display =
        allDisplays.find((d) => d.id === settingsStore?.display) ||
        primaryDisplay
      const displayBounds = mapValues(display.bounds, (v) => v + 24)
      window.setPosition(displayBounds.x, displayBounds.y)
    }
  }

  const hide = () => {
    setDisplay()
  }

  const addEventListeners = () => {
    gkl?.addListener((e) => {
      if (
        settingsStore &&
        settingsStore.enableSTTTS &&
        settingsStore.speechRecognitionStrategy === 'ptr' &&
        e.state === 'DOWN' &&
        !deferredRecording &&
        keybindingTriggered(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording = Deferred()
        console.log(`[${getTime()}] Starting recording`)
        speechRecognitionStore?.$patch({
          recording: true,
        })
      }
    })

    gkl?.addListener((e) => {
      if (
        settingsStore &&
        settingsStore.enableSTTTS &&
        settingsStore.speechRecognitionStrategy === 'ptr' &&
        e.state === 'UP' &&
        deferredRecording &&
        keybindingReleased(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording.resolve(true)
        deferredRecording = null
        console.log(`[${getTime()}] Stopping recording`)
        speechRecognitionStore?.$patch({
          recording: false,
        })
      }
    })
  }
  const restartNativeSpeechRecognition = () => {
    if (electronNativeSpeechRecognitionCallback) {
      electronNativeSpeechRecognitionCallback()
    }
    if (settingsStore?.enableSTTTS) {
      electronNativeSpeechRecognitionCallback =
        electronNativeSpeechRecognition()
    }
  }

  isReady().then(() => {
    settingsStore = useSettingsStore()
    speechStore = useSpeechStore()
    speechRecognitionStore = useSpeechRecognitionStore()

    watch(
      () => [
        settingsStore?.soxDevice,
        settingsStore?.enableSTTTS,
        settingsStore?.speechRecognitionStrategy,
        settingsStore?.speechInputLanguage,
        settingsStore?.soxPreRecordingChunks,
        settingsStore?.soxPostRecordingChunks,
        settingsStore?.speechProfanityFilter,
        speechStore?.currentSpeechEngine,
      ],
      restartNativeSpeechRecognition,
      { deep: true, immediate: true },
    )

    watch(
      () => speechRecognitionStore?.recording,
      (recording) => (recording ? show() : hide()),
      { immediate: true },
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
    restartNativeSpeechRecognition,
    setDisplay,
    show,
    hide,
  }
}

export default ElectronSpeechWindow()
