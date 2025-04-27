// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { Profile } from './types'
import { stores } from '@packages/electron-pinia'

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
    const profiles = ref<Profile[]>([])
    const createProfile = (): Profile => {
      return {
        id: uuid(),
        name: '',
        openMessengerOnTrigger: true,
        shortcut: [],
        states: {},
      }
    }
    const addProfile = () => {
      profiles.value.push(createProfile())
    }
    return {
      profiles,
      addProfile,
      delete(id: string) {
        const index = profiles.value.findIndex((v) => v.id === id)
        if (index > -1) {
          profiles.value.slice(index, 1)
        }
      },
      update(profile: Profile) {
        const index = profiles.value.findIndex((v) => v.id === profile.id)
        if (index > -1) {
          profiles.value.splice(index, 1, profile)
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
