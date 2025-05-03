// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { Profile } from './types'
import { stores } from '@packages/electron-pinia'
import { useSettingsStore } from '@/features/settings/store'
import { cloneDeep } from 'lodash'
import speechEngineManager from '@/modules/speech-engine-manager'
import translationEngineManager from '@/modules/translation-engine-manager'

const unflatten = (obj = {}) => {
  const result = {}
  let temp, substrings, property, i
  for (property in obj) {
    substrings = property.split('.')
    temp = result
    for (i = 0; i < substrings.length - 1; i++) {
      if (!(substrings[i] in temp)) {
        if (isFinite(substrings[i + 1])) {
          temp[substrings[i]] = []
        } else {
          temp[substrings[i]] = {}
        }
      }
      temp = temp[substrings[i]]
    }
    temp[substrings[substrings.length - 1]] = obj[property]
  }
  return result
}

export const useProfilesStore = defineStore(
  'profiles',
  () => {
    const settingsStore = useSettingsStore()
    const profiles = ref<Profile[]>([])
    const createProfile = (): Profile => {
      const speechEngine = speechEngineManager.getEngineById(
        settingsStore.selectedSpeechEngine,
      )
      const translationEngine = translationEngineManager.getEngineById(
        settingsStore.selectedTranslationEngine,
      )
      return cloneDeep({
        id: uuid(),
        name: `Profile ${profiles.value.length + 1}`,
        openMessengerOnTrigger: true,
        shortcut: [],
        states: {
          'settings.selectedSpeechEngine': settingsStore.selectedSpeechEngine,
          'settings.selectedTranslationEngine':
            settingsStore.selectedTranslationEngine,
          ...(speechEngine
            ? {
                [speechEngine.store.getPropertyPath('selectedVoice')]:
                  speechEngine.store.getProperty('selectedVoice'),
              }
            : {}),
          ...(translationEngine
            ? {
                [translationEngine.store.getPropertyPath('translateFrom')]:
                  translationEngine.store.getProperty('translateFrom') || null,
                [translationEngine.store.getPropertyPath('translateTo')]:
                  translationEngine.store.getProperty('translateTo') || null,
              }
            : {}),
        },
      })
    }

    return {
      profiles,
      addProfile() {
        profiles.value.unshift(createProfile())
      },
      delete(id: string) {
        const index = profiles.value.findIndex((v) => v.id === id)
        if (index > -1) {
          profiles.value.splice(index, 1)
        }
      },
      apply(id: string) {
        const profile = profiles.value.find((v) => v.id === id)
        if (profile) {
          const unflattenedStates = unflatten(profile.states)
          Object.entries(unflattenedStates).forEach(([name, state]) => {
            const store = stores.get(name)
            if (store && state) {
              store.$patch(state)
            }
          })
        }
      },
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
