import { useQuery } from 'vue-query'
import axios from 'axios'
import { useSettingsStore } from '@/features/settings/store'
import { decrypt } from '@/utils/security'

export const useGetCustomLanguagesQueryKey = () => ['get-custom-languages']
export const useGetCustomLanguagesQuery = () =>
  useQuery(useGetCustomLanguagesQueryKey(), async () => {
    const settingsStore = useSettingsStore()
    const endpoint = settingsStore.customTextTranslationEndpoint
    const { data } = await axios.post<{
      from: {
        id: string
        name: string
      }[]
      to: {
        id: string
        name: string
      }[]
    }>(`${endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint}/languages`, {
      credentials: {
        apiKey: decrypt(settingsStore.customTextTranslationApiKey),
      },
    })
    return data
  })
