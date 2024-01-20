import { useSettingsStore } from '@/features/settings/store'
import { v2 } from '@google-cloud/translate'
import axios from 'axios'
import { decrypt } from '@/utils/security'

export const ElectronTranslation = () => ({
  async translate(
    text: string,
    options: {
      from?: string
      to: string
      model?: string
      format?: string
    },
  ): Promise<string> {
    try {
      const settingsStore = useSettingsStore()
      if (settingsStore.textTranslationStrategy === 'cloud-translation') {
        const translate = new v2.Translate()
        const [translations] = await translate.translate(text, options)
        return translations
      }
      if (settingsStore.textTranslationStrategy === 'custom') {
        const endpoint = settingsStore.customTextTranslationEndpoint
        const { data } = await axios.post<string>(
          `${endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint}/translate`,
          {
            credentials: {
              apiKey: decrypt(settingsStore.customTextTranslationApiKey),
            },
            payload: {
              text,
              from: settingsStore.customTextTranslationFrom,
              to: settingsStore.customTextTranslationTo,
            },
          },
        )
        return data
      }
      return text
    } catch (error) {
      return text
    }
  },
})

export default ElectronTranslation()
