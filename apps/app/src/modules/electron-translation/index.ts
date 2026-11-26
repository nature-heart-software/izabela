import { v2 } from '@google-cloud/translate'
import { reportProviderError } from '@/features/session-errors/report'
import { ENGINE_ID } from '../../plugins/translation-engines/google-cloud/shared'

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
      const translate = new v2.Translate()
      const [translations] = await translate.translate(text, options)
      return translations
    } catch (error) {
      reportProviderError(error, 'translation', ENGINE_ID)
      return text
    }
  },
})

export default ElectronTranslation()
