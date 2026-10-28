import { useQuery } from 'vue-query'
import axios from 'axios'
import { store } from './store'
import { ENGINE_ID } from './shared.ts'
import { computed } from 'vue'

export const getLanguagesQueryKey = () => [ENGINE_ID, 'get-languages']
export const useGetLanguagesQuery = () =>
  useQuery({
    queryKey: computed(() => [
      ...getLanguagesQueryKey(),
      store.getProperty('endpoint'),
      store.getProperty('apiKey'),
    ]),
    queryFn: async () => {
      const endpoint = store.getProperty('endpoint')
      const { data } = await axios.post<{
        from: {
          id: string
          value?: string
          name: string
        }[]
        to: {
          id: string
          value?: string
          name: string
        }[]
      }>(
        `${
          endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        }/languages`,
        {
          credentials: {
            apiKey: store.getProperty('apiKey', true),
          },
        },
      )
      return {
        from: data.from.map((language) => ({
          ...language,
          value: language.value ?? language.id,
        })),
        to: data.to.map((language) => ({
          ...language,
          value: language.value ?? language.id,
        })),
      }
    },
    enabled: computed(() => !!store.getProperty('endpoint')),
  })
