import { useQuery } from 'vue-query'
import axios from 'axios'
import { store } from './store'
import { ENGINE_ID } from './shared.ts'

export const getLanguagesQueryKey = () => [ENGINE_ID, 'get-languages']
export const useGetLanguagesQuery = () =>
  useQuery(getLanguagesQueryKey(), async () => {
    const endpoint = store.getProperty('endpoint')
    const { data } = await axios.post<{
      from: {
        id: string
        name: string
      }[]
      to: {
        id: string
        name: string
      }[]
    }>(
      `${endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint}/languages`,
      {
        credentials: {
          apiKey: store.getProperty('endpoint', true),
        },
      },
    )
    return data
  })
