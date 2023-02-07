// see: https://tipsfordev.com/stream-audio-with-websocket-and-get-back-audio-transcription-obtained-with-google-speech-api
import speech from '@google-cloud/speech'
import path from 'path'
// import iohook from 'iohook'
import { app, BrowserWindow } from 'electron'
import { ipcMain } from 'electron-postman'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { createNotification } from '@/utils/electron-notification'
import { useSettingsStore } from '@/features/settings/store'
import { useSpeechStore } from '@/features/speech/store'
import { Deferred } from '@packages/toolbox'
import { gkl, keybindingReleased, keybindingTriggered } from '@/modules/electron-keybinding/utils'

export const ElectronSpeechWindow = () => {
  let deferredRecording: ReturnType<typeof Deferred> | null = null
  let registeredWindow: BrowserWindow | null = null
  const ready = Deferred<BrowserWindow>()
  const isReady = () => ready.promise
  let settingsStore: ReturnType<typeof useSettingsStore> | undefined
  let speechStore: ReturnType<typeof useSpeechStore> | undefined

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

  const start = (window: BrowserWindow) => {
    registeredWindow = window
    ready.resolve(window)
  }

  const addEventListeners = () => {
    app.whenReady().then(() => {
      const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
      const googleCloudSpeechCredentialsFilePath = path.join(
        credentialsDirPath,
        'google-cloud-speech-credentials.json',
      )
      process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCloudSpeechCredentialsFilePath
    })

    gkl.addListener((e, down) => {
      if (!settingsStore) return
      if (
        e.state === 'DOWN' &&
        !deferredRecording &&
        keybindingTriggered(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording = Deferred()
        ipcMain.sendTo('speech-worker', 'start-speech-transcription')
      }
    })
    // iohook.on('keydown', (event) => {
    //   if (!settingsStore) return
    //   const keybinding = settingsStore.keybindings.recordAudio[0]
    //   if (keybinding && keybinding.rawCode === event.rawcode && !deferredRecording) {
    //     deferredRecording = Deferred()
    //     ipcMain.sendTo('speech-worker', 'start-speech-transcription')
    //   }
    // })

    gkl.addListener((e, down) => {
      if (!settingsStore) return
      if (
        e.state === 'UP' &&
        deferredRecording &&
        keybindingReleased(settingsStore.keybindings.recordAudio)
      ) {
        deferredRecording.resolve(true)
        deferredRecording = null
        ipcMain.sendTo('speech-worker', 'stop-speech-transcription')
      }
    })
    // iohook.on('keyup', (event) => {
    //   if (!settingsStore) return
    //   const keybinding = settingsStore.keybindings.recordAudio[0]
    //   if (keybinding && keybinding.rawCode === event.rawcode && deferredRecording) {
    //     deferredRecording.resolve(true)
    //     deferredRecording = null
    //     ipcMain.sendTo('speech-worker', 'stop-speech-transcription')
    //   }
    // })
  }

  isReady().then(() => {
    settingsStore = useSettingsStore()
    speechStore = useSpeechStore()
    addEventListeners()
  })
  return {
    start,
    transcribeAudio,
    isReady,
  }
}

export default ElectronSpeechWindow()
