import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Hitbox } from './types'

export const useHitboxesStore = defineStore(
  'hitboxes',
  () => {
    const hitboxes = ref<Hitbox[]>([])
    return {
      hitboxes,
      addHitbox(hitbox: Hitbox) {
        const newHitboxes = [...hitboxes.value]
        const hitboxIndex = newHitboxes.findIndex((i) => i.id === hitbox.id)
        if (hitboxIndex < 0) {
          newHitboxes.push({ ...hitbox })
        } else {
          newHitboxes.splice(hitboxIndex, 1, { ...hitbox })
        }
        hitboxes.value = newHitboxes
      },
      removeHitbox(id: Hitbox['id']) {
        const newHitboxes = [...hitboxes.value]
        const hitboxIndex = newHitboxes.findIndex((i) => i.id === id)
        if (hitboxIndex >= 0) {
          newHitboxes.splice(hitboxIndex, 1)
        }
        hitboxes.value = newHitboxes
      },
    }
  },
  { electron: { shared: true } },
)
