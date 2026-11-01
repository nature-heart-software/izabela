import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'
import {
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'

bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({
        text,
        from,
        to,
        credentials: { identityPoolId, region },
      }: any) {
        let client: TranslateClient | undefined
        try {
          const getCredentials = fromCognitoIdentityPool({
            clientConfig: {
              region,
            },
            identityPoolId,
          })

          const credentials = await getCredentials()
          client = new TranslateClient({
            region,
            credentials,
          })

          const command = new TranslateTextCommand({
            Text: text,
            SourceLanguageCode: from,
            TargetLanguageCode: to,
          })

          const response = await client.send(command)
          return response.TranslatedText
        } catch (e) {
          console.error('Amazon Translate failed', e)
          return text
        } finally {
          client?.destroy()
        }
      },
    }),
  ],
])
