// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import { ENGINE_ID } from '@/plugins/speech-engines/say/shared'
import { useSettingsStore } from '@/features/settings/store'
import { decrypt } from '@/utils/security'
import { SpeechCommand } from '@/features/speech/types'

export const useSpeechStore = defineStore(
  'speech',
  () => {
    const selectedSpeechEngine = computed(() => {
      const settingsStore = useSettingsStore()
      const engine = getEngineById(settingsStore.selectedSpeechEngine)
      if (engine && (!engine.hasCredentials || engine.hasCredentials())) {
        return settingsStore.selectedSpeechEngine
      }
      return ENGINE_ID
    })
    const hasUniversalApiCredentials = computed(() => {
      const settingsStore = useSettingsStore()
      return Boolean(decrypt(settingsStore.universalApiKey) && settingsStore.universalApiEndpoint)
    })
    const customCommands = ref<SpeechCommand[]>([])
    const addCustomCommand = (
      command: SpeechCommand = {
        name: '',
        value: '',
        description: '',
      },
    ) => {
      customCommands.value.unshift(command)
    }
    const removeCustomCommand = (index: number) => {
      customCommands.value.splice(index, 1)
    }
    const updateCustomCommands = (index: number, customCommand: SpeechCommand) => {
      customCommands.value.splice(index, 1, customCommand)
    }
    const engineCommands = computed(() => {
      const settingsStore = useSettingsStore()
      const engine = getEngineById(settingsStore.selectedSpeechEngine)
      if (engine && engine.commands) {
        const voice = engine.store.getProperty('selectedVoice')
        return engine.commands(voice)
      }
      return []
    })
    return {
      selectedSpeechEngine,
      currentSpeechEngine: computed(() => getEngineById(selectedSpeechEngine.value)),
      commands: computed(() => [...engineCommands.value, ...customCommands.value]),
      hasUniversalApiCredentials,
      customCommands,
      engineCommands,
      addCustomCommand,
      removeCustomCommand,
      updateCustomCommands,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
