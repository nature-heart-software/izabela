import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'
import TextTranslationClient, {
  isUnexpected,
} from '@azure-rest/ai-translation-text'

bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({
        text,
        from,
        to,
        credentials: { apiKey: key, region },
      }: any) {
        try {
          const endpoint = `https://api.cognitive.microsofttranslator.com/`
          const translationClient = TextTranslationClient(endpoint, {
            key,
            region,
          })

          const translateResponse = await translationClient
            .path('/translate')
            .post({
              body: {
                inputs: [
                  {
                    text,
                    ...(from ? { language: from } : {}),
                    targets: [{ language: to }],
                  },
                ],
              },
            })
          if (isUnexpected(translateResponse)) {
            throw translateResponse.body.error
          }
          const translations = translateResponse.body.value
          return translations[0]?.translations[0]?.text
        } catch (e) {
          return text
        }
      },
    }),
  ],
])
