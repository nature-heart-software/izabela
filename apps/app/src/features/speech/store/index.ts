// eslint-disable-next-line import/no-cycle
import { getEngineById } from '@/modules/speech-engine-manager'
import { ENGINE_ID } from '@/plugins/speech-engines/say/consts'
import { useSettingsStore } from '@/features/settings/store'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useSpeechStore = defineStore('speech', () => {
  const selectedSpeechEngine = computed(() => {
    const settingsStore = useSettingsStore()
    const engine = getEngineById(settingsStore.selectedSpeechEngine)
    if (engine && engine.hasCredentials && engine.hasCredentials()) {
      return settingsStore.selectedSpeechEngine
    }
    return ENGINE_ID
  })
  return {
    selectedSpeechEngine,
    currentSpeechEngine: computed(() =>
      getEngineById(selectedSpeechEngine.value)),
    commands: computed(() => {
      const settingsStore = useSettingsStore()
      const engine = getEngineById(settingsStore.selectedSpeechEngine)
      if (engine && engine.commands) {
        const voice = engine.store.getProperty('selectedVoice')
        return engine.commands(voice)
      }
      return []
    }),
  }
}, {
  electron: {
    persisted: true,
    shared: true,
  },
})
