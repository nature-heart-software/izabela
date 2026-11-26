import speechEngineManager from '@/modules/speech-engine-manager'
import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'
import translationEngineManager from '@/modules/translation-engine-manager'
import type { SessionError } from './store'

/** Resolve only plugin-owned names, never an unrecognized ID or endpoint. */
export function getProviderName(
  error: Pick<SessionError, 'operation' | 'provider'>,
): string | undefined {
  if (!error.provider) return undefined
  switch (error.operation) {
    case 'speech':
      return speechEngineManager.getEngineById(error.provider)?.name
    case 'speech-recognition':
      return speechRecognitionEngineManager.getEngineById(error.provider)?.name
    case 'translation':
      return translationEngineManager.getEngineById(error.provider)?.name
    default:
      return undefined
  }
}
