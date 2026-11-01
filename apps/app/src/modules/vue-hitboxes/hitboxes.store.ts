import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Hitbox } from './types'
import { v4 as uuid } from 'uuid'

// only one session can exist and it must be provided on a per call basis
export const hitboxStoreSessionId = uuid()

export const useHitboxesStore = defineStore(
  'hitboxes',
  () => {
    const hitboxes = ref<Hitbox[]>([])

    function removeHitbox(id: Hitbox['id']) {
      const newHitboxes = [...hitboxes.value]
      const hitboxIndex = newHitboxes.findIndex((i) => i.id === id)
      if (hitboxIndex >= 0) {
        newHitboxes.splice(hitboxIndex, 1)
      }
      hitboxes.value = newHitboxes
    }

    function addHitbox(hitbox: Hitbox) {
      const newHitboxes = [...hitboxes.value]
      const hitboxIndex = newHitboxes.findIndex((i) => i.id === hitbox.id)
      if (hitboxIndex < 0) {
        newHitboxes.push({ ...hitbox })
      } else {
        newHitboxes.splice(hitboxIndex, 1, { ...hitbox })
      }
      hitboxes.value = newHitboxes.filter(
        (item) =>
          item.sessionId === hitbox.sessionId && item.w > 0 && item.h > 0,
      )
    }

    return {
      hitboxes,
      addHitbox,
      removeHitbox,
    }
  },
  { electron: { shared: true } },
)
