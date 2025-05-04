import { v2 } from '@google-cloud/translate'

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
      return text
    }
  },
})

export default ElectronTranslation()
