import pkg from '@root/package.json'
// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { Key } from '@/types/keybinds'
import { ENGINE_ID } from '@/plugins/speech-engines/say/consts'
import { defineStore } from 'pinia'
import { ref } from 'vue'

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

    const playSpeechOnDefaultPlaybackDevice = ref(true)
    const audioOutputs = ref<MediaDeviceInfo['label'][]>([])
    const audioInput = ref<MediaDeviceInfo['label']>('default')
    const selectedSpeechEngine = ref<SpeechEngine['id']>(ENGINE_ID)
    const updateChannel = ref(channel)
    const launchOnStartup = ref(true)
    const debugMode = ref(process.env.NODE_ENV === 'development')
    const messageMode = ref<'sentence' | 'word'>('sentence')
    const display = ref<undefined | Electron.Display['id']>()
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
    })
    return {
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
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
