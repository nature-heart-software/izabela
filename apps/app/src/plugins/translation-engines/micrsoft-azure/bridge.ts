import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'
import azure, { InputTextItem } from '@azure-rest/ai-translation-text'

bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({ text, from, to, credentials: { apiKey: key, region}}: any) {
        try {
          const { default: TextTranslationClient, isUnexpected } = azure as any
          const endpoint = `https://api.cognitive.microsofttranslator.com/`
          const translationClient = TextTranslationClient(
            endpoint,
            {
              key,
              region,
            },
          )

          const inputText: InputTextItem[] = [{ text }];
          const translateResponse = await translationClient.path("/translate").post({
            body: inputText,
            queryParameters: {
              to,
              from,
            },
          });
          if (isUnexpected(translateResponse)) {
            throw translateResponse.body.error;
          }
          const translations = translateResponse.body;
          return translations[0]?.translations[0]?.text
        } catch (e) {
          return text
        }
      },
    }),
  ],
])
