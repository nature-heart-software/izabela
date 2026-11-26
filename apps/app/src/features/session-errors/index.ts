import {
  useSessionErrorsStore,
  type SessionError,
} from '@/features/session-errors/store'

// Only built-in provider identities may become visible labels; custom endpoints are never displayed.
const providers = new Map<string, string>([
  ...[
    'openai',
    'openai-tts',
    'openai-translation',
    'openai-speech-recognition',
  ].map((id): [string, string] => [id, 'OpenAI']),
  ...[
    'google-cloud',
    'gctts',
    'google-cloud-translation',
    'google-cloud-speech-recognition',
  ].map((id): [string, string] => [id, 'Google Cloud']),
  ...['google-translate', 'google-translate-translation'].map(
    (id): [string, string] => [id, 'Google Translate'],
  ),
  ...[
    'microsoft-azure',
    'matts',
    'microsoft-azure-translation',
    'microsoft-azure-speech-recognition',
  ].map((id): [string, string] => [id, 'Microsoft Azure']),
  ...['amazon-polly', 'aptts'].map((id): [string, string] => [
    id,
    'Amazon Polly',
  ]),
  ...['amazon-transcribe', 'amazon-transcribe-recognition'].map(
    (id): [string, string] => [id, 'Amazon Transcribe'],
  ),
  ...['amazon-translation', 'amazon-translate-translation'].map(
    (id): [string, string] => [id, 'Amazon Translate'],
  ),
  ...['ibm-watson', 'iwtts', 'ibm-watson-speech-recognition'].map(
    (id): [string, string] => [id, 'IBM Watson'],
  ),
  ...['elevenlabs', '11labstts', 'elevenlabs-speech-recognition'].map(
    (id): [string, string] => [id, 'ElevenLabs'],
  ),
  ...[
    'custom',
    'customtts',
    'custom-translation',
    'custom-speech-recognition',
  ].map((id): [string, string] => [id, 'Custom']),
  ['izabelatts', 'Izabela'],
  ['saytts', 'System speech'],
  ['animalesetts', 'Animalese'],
  ['samtts', 'SAM'],
  ['external-audio', 'Audio'],
])

export default {
  report(input: Pick<SessionError, 'category' | 'operation' | 'provider'>) {
    const store = useSessionErrorsStore()
    const revision = store.revision + 1
    const entry: SessionError = {
      id: String(revision),
      createdAt: new Date().toISOString(),
      category:
        input?.category === 'connection'
          ? 'connection'
          : input?.category === 'subscription'
            ? 'subscription'
            : 'other',
      operation: ['speech', 'speech-recognition', 'translation'].includes(
        input?.operation,
      )
        ? input.operation
        : 'provider',
      ...(providers.has(input?.provider || '')
        ? { provider: providers.get(input.provider!) }
        : {}),
    }
    store.$patch({
      entries: [...store.entries, entry],
      hasOccurred: true,
      revision,
    })
  },
  read() {
    const store = useSessionErrorsStore()
    return {
      entries: store.entries.map((entry) => ({ ...entry })),
      hasOccurred: store.hasOccurred,
      revision: store.revision,
    }
  },
  clear() {
    const store = useSessionErrorsStore()
    store.$patch({ entries: [], revision: store.revision + 1 })
  },
}
