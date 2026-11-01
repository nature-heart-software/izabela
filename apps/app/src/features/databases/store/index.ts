import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDatabasesStore = defineStore(
  'databases',
  () => {
    const databases = ref([
      'game-overlay-allowlist',
      'game-overlay-denylist',
    ] as const)
    const data = ref<Partial<Record<(typeof databases.value)[number], any>>>({})
    return {
      databases,
      data,
      setDatabaseData(
        database: (typeof databases.value)[number],
        databaseData: any,
      ) {
        data.value[database] = databaseData
      },
    }
  },
  {
    electron: {
      persisted: false,
      shared: true,
    },
  },
)
