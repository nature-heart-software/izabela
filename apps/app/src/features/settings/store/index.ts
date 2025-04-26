import pkg from '@root/package.json'
// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { Key } from '@/types/keybinds'
import { ENGINE_ID } from '@/plugins/speech-engines/say/shared'
import { useMessengerStateStore } from '@/teams/messenger/store'

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

    const enableAutoUpdate = ref(true)
    const enableOverlayWindow = ref(false)
    const preferredSavDir = ref<null | string>(null)
    const playSpeechOnDefaultPlaybackDevice = ref(true)
    const audioOutputs = ref<MediaDeviceInfo['label'][]>([])
    const audioInput = ref<MediaDeviceInfo['label']>('default')
    const selectedSpeechEngine = ref<SpeechEngine['id']>(ENGINE_ID)
    const selectedSpeechRecognitionEngine = ref<
      | 'google-cloud'
      | 'microsoft-azure'
      | 'amazon-transcribe'
      | 'ibm-watson'
      | 'openai'
      | 'elevenlabs'
      | 'custom'
    >('google-cloud')
    const updateChannel = ref(channel)
    const launchOnStartup = ref(true)
    const runAsAdmin = ref(false)
    const debugMode = ref(import.meta.env.MODE === 'development')
    const messageMode = ref<'sentence' | 'word'>('sentence')
    const display = ref<Electron.Display['id'] | null>(null)
    const hideWindowOnMessage = ref(false)
    const universalApiKey = ref<string>('')
    const universalApiEndpoint = ref<string>('')
    const audioInputSensibility = ref(-50)
    const soxPreRecordingChunks = ref(3)
    const soxPostRecordingChunks = ref(3)
    const soxDevice = ref(0)
    const speechDetectionPolling = ref(40)
    const enableSTTTS = ref(false)
    const textInputLanguage = ref(null)
    const textOutputLanguage = ref(null)
    const speechInputLanguage = ref('en-US')
    const enableTranslation = ref(false)
    const speechProfanityFilter = ref(true)
    const speechRecognitionStrategy = ref<'continuous' | 'ptr'>('ptr')
    const textTranslationStrategy = ref<'cloud-translation' | 'custom'>(
      'cloud-translation',
    )
    const customTextTranslationEndpoint = ref('')
    const customTextTranslationApiKey = ref('')
    const customTextTranslationFrom = ref('')
    const customTextTranslationTo = ref('')
    // const enableBackgroundDim = ref(true)
    const backgroundDimOpacity = ref(50)
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
          key: 'ControlRight',
          code: 'ControlRight',
          keyCode: 17,
          rawCode: 163,
          charCode: 0,
          which: 17,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
      toggleOverlayWindow: [
        {
          key: 'Alt',
          code: 'AltLeft',
          keyCode: 18,
          rawCode: 164,
          charCode: 0,
          which: 18,
          shiftKey: false,
          altKey: true,
          ctrlKey: false,
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
          altKey: true,
          ctrlKey: false,
          metaKey: false,
        },
      ],
      cancelCurrentMessage: [
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
          key: 'Delete',
          code: 'Delete',
          keyCode: 46,
          rawCode: 46,
          charCode: 0,
          which: 46,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
      cancelAllMessages: [
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
          key: 'Backspace',
          code: 'Backspace',
          keyCode: 8,
          rawCode: 8,
          charCode: 0,
          which: 8,
          shiftKey: false,
          altKey: false,
          ctrlKey: true,
          metaKey: false,
        },
      ],
    })

    const messengerStateStore = useMessengerStateStore()

    const enableRunAsAdmin = () => {
      runAsAdmin.value = true
      messengerStateStore.$patch({
        markForRestart: true,
      })
    }

    const disableRunAsAdmin = () => {
      runAsAdmin.value = false
      messengerStateStore.$patch({
        markForRestart: false,
      })
    }

    return {
      enableAutoUpdate,
      enableRunAsAdmin,
      disableRunAsAdmin,
      enableOverlayWindow,
      // enableBackgroundDim,
      backgroundDimOpacity,
      preferredSavDir,
      playSpeechOnDefaultPlaybackDevice,
      audioOutputs,
      audioInput,
      selectedSpeechEngine,
      selectedSpeechRecognitionEngine,
      updateChannel,
      launchOnStartup,
      runAsAdmin,
      debugMode,
      messageMode,
      display,
      keybindings,
      hideWindowOnMessage,
      universalApiKey,
      universalApiEndpoint,
      audioInputSensibility,
      speechDetectionPolling,
      enableSTTTS,
      speechRecognitionStrategy,
      soxDevice,
      textInputLanguage,
      textOutputLanguage,
      speechInputLanguage,
      enableTranslation,
      textTranslationStrategy,
      customTextTranslationEndpoint,
      customTextTranslationApiKey,
      customTextTranslationFrom,
      customTextTranslationTo,
      speechProfanityFilter,
      soxPreRecordingChunks,
      soxPostRecordingChunks,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
