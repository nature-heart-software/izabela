import { bridge } from '@packages/electron-bridger'
import { reportProviderError } from '@/features/session-errors/report'
import { electronModuleName } from './shared.ts'
import { translate } from '@vitalets/google-translate-api'

bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({ text, from, to }: any) {
        try {
          const response = await translate(text, { from, to })
          return response.text
        } catch (e) {
          reportProviderError(e, 'translation', 'google-translate')
          return text
        }
      },
    }),
  ],
])
