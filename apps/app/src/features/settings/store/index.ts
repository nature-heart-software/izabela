import pkg from '@root/package.json'
// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { Key } from '@/types/keybinds'
import { ENGINE_ID } from '@/plugins/speech-engines/say/shared'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const { version } = pkg
    // eslint-disable-next-line no-nested-ternary
    const channel = version.includes('alpha')
      ? 'alpha'
      : // eslint-disable-next-line no-nested-ternary
      version.includes('beta')
      ? 'beta'
      : version.includes('rc')
      ? 'rc'
      : 'latest'

    const preferredSavDir = ref<null | string>(null)
    const playSpeechOnDefaultPlaybackDevice = ref(true)
    const audioOutputs = ref<MediaDeviceInfo['label'][]>([])
    const audioInput = ref<MediaDeviceInfo['label']>('default')
    const selectedSpeechEngine = ref<SpeechEngine['id']>(ENGINE_ID)
    const updateChannel = ref(channel)
    const launchOnStartup = ref(true)
    const debugMode = ref(process.env.NODE_ENV === 'development')
    const messageMode = ref<'sentence' | 'word'>('sentence')
    const display = ref<Electron.Display['id'] | null>(null)
    const hideWindowOnMessage = ref(false)
    const universalApiKey = ref<string>('')
    const universalApiEndpoint = ref<string>('')
    const audioInputSensibility = ref(-60)
    const soxThreshold = ref(0.5)
    const soxSilence = ref(100)
    const soxDevice = ref(0)
    const speechPrerecordTime = ref(300)
    const speechPostrecordTime = ref(100)
    const enableSTTTS = ref(false)
    const speechRecognitionStrategy = ref<'continuous-native' | 'continuous-web' | 'ptr'>('ptr')
    const keybindings = ref<Record<string, Key[]>>({
      recordAudio: [
        {
          key: 'ShiftRight',
          code: 'ShiftRight',
          keyCode: 16,
          rawCode: 161,
          charCode: 0,
          which: 16,
          shiftKey: true,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
        },
      ],
      toggleMessengerWindow: [
        {
          key: 'Control',
          code: 'ControlLeft',
          keyCode: 17,
          rawCode: 162,
          charCode: 0,
          which: 17,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
        {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          rawCode: 13,
          charCode: 0,
          which: 13,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
      toggleMessengerWindowAlt: [
        {
          key: 'Control',
          code: 'ControlLeft',
          keyCode: 17,
          rawCode: 162,
          charCode: 0,
          which: 17,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
        {
          key: 'Space',
          code: 'Space',
          keyCode: 32,
          rawCode: 32,
          charCode: 0,
          which: 32,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
    })
    return {
      preferredSavDir,
      playSpeechOnDefaultPlaybackDevice,
      audioOutputs,
      audioInput,
      selectedSpeechEngine,
      updateChannel,
      launchOnStartup,
      debugMode,
      messageMode,
      display,
      keybindings,
      hideWindowOnMessage,
      universalApiKey,
      universalApiEndpoint,
      audioInputSensibility,
      speechPrerecordTime,
      speechPostrecordTime,
      enableSTTTS,
      speechRecognitionStrategy,
      soxThreshold,
      soxSilence,
      soxDevice,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
