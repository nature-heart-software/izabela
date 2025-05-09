import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'
import { translate } from '@vitalets/google-translate-api'

console.log(electronModuleName)
bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({ text, from, to }: any) {
        try {
          const response = await translate(text, { from, to })
          return response.text
        } catch (e) {
          return text
        }
      },
    }),
  ],
])
