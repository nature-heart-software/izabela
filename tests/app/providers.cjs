const providers = [
  {
    kind: 'tts',
    id: 'aptts',
    name: 'Amazon Polly',
    route: 'amazon-polly',
    env: [
      'VITE_SPEECH_ENGINE_AMAZON_POLLY_IDENTITY_POOL_ID',
      'VITE_SPEECH_ENGINE_AMAZON_POLLY_REGION',
    ],
  },
  {
    kind: 'tts',
    id: 'gctts',
    name: 'Google Cloud',
    route: 'google-cloud',
    env: ['VITE_SPEECH_ENGINE_GOOGLE_CLOUD_API_KEY'],
  },
  {
    kind: 'tts',
    id: 'matts',
    name: 'Microsoft Azure',
    route: 'microsoft-azure',
    env: [
      'VITE_SPEECH_ENGINE_MICROSOFT_AZURE_API_KEY',
      'VITE_SPEECH_ENGINE_MICROSOFT_AZURE_REGION',
    ],
  },
  {
    kind: 'tts',
    id: 'iwtts',
    name: 'IBM Watson',
    route: 'ibm-watson',
    env: [
      'VITE_SPEECH_ENGINE_IBM_WATSON_API_KEY',
      'VITE_SPEECH_ENGINE_IBM_WATSON_URL',
    ],
  },
  {
    kind: 'tts',
    id: '11labstts',
    name: 'ElevenLabs',
    route: 'elevenlabs',
    env: ['VITE_SPEECH_ENGINE_ELEVENLABS_API_KEY'],
  },
  {
    kind: 'tts',
    id: 'openai-tts',
    name: 'OpenAI',
    route: 'openai',
    env: ['VITE_SPEECH_ENGINE_OPENAI_API_KEY'],
  },
  {
    kind: 'stt',
    id: 'amazon-transcribe-recognition',
    name: 'Amazon Transcribe',
    env: [
      'VITE_SPEECH_RECOGNITION_ENGINE_AMAZON_TRANSCRIBE_IDENTITY_POOL_ID',
      'VITE_SPEECH_RECOGNITION_ENGINE_AMAZON_TRANSCRIBE_REGION',
    ],
  },
  {
    kind: 'stt',
    id: 'google-cloud-speech-recognition',
    name: 'Google Cloud',
    env: ['VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT'],
  },
  {
    kind: 'stt',
    id: 'microsoft-azure-speech-recognition',
    name: 'Microsoft Azure',
    env: [
      'VITE_SPEECH_RECOGNITION_ENGINE_MICROSOFT_AZURE_API_KEY',
      'VITE_SPEECH_RECOGNITION_ENGINE_MICROSOFT_AZURE_REGION',
    ],
  },
  {
    kind: 'stt',
    id: 'ibm-watson-speech-recognition',
    name: 'IBM Watson',
    env: [
      'VITE_SPEECH_RECOGNITION_ENGINE_IBM_WATSON_API_KEY',
      'VITE_SPEECH_RECOGNITION_ENGINE_IBM_WATSON_URL',
    ],
  },
  {
    kind: 'stt',
    id: 'elevenlabs-speech-recognition',
    name: 'ElevenLabs',
    env: ['VITE_SPEECH_RECOGNITION_ENGINE_ELEVENLABS_API_KEY'],
  },
  {
    kind: 'stt',
    id: 'openai-speech-recognition',
    name: 'OpenAI',
    env: ['VITE_SPEECH_RECOGNITION_ENGINE_OPENAI_API_KEY'],
  },
  {
    kind: 'translation',
    id: 'amazon-translate-translation',
    name: 'Amazon Translate',
    env: [
      'VITE_TRANSLATION_ENGINE_AMAZON_TRANSLATION_IDENTITY_POOL_ID',
      'VITE_TRANSLATION_ENGINE_AMAZON_TRANSLATION_REGION',
    ],
  },
  {
    kind: 'translation',
    id: 'microsoft-azure-translation',
    name: 'Microsoft Azure',
    env: [
      'VITE_TRANSLATION_ENGINE_MICROSOFT_AZURE_API_KEY',
      'VITE_TRANSLATION_ENGINE_MICROSOFT_AZURE_REGION',
    ],
  },
  {
    kind: 'translation',
    id: 'openai-translation',
    name: 'OpenAI',
    env: ['VITE_TRANSLATION_ENGINE_OPENAI_API_KEY'],
  },
  {
    kind: 'translation',
    id: 'google-cloud-translation',
    name: 'Google Cloud',
    env: ['VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT'],
  },
  {
    kind: 'translation',
    id: 'google-translate-translation',
    name: 'Google Translate',
    env: [],
  },
]
// Infisical still contains a key for this retired integration. It has no
// application registration and must be reported, never counted as a pass.
const retiredVariables = {
  VITE_SPEECH_ENGINE_UBERDUCK_API_KEY:
    'Uberduck (no application implementation)',
}
function inventory(environment) {
  return providers.map((provider) => ({
    ...provider,
    enabled: provider.env.every((key) => Boolean(environment[key]?.trim())),
    missing: provider.env.filter((key) => !environment[key]?.trim()),
  }))
}
function assertInventoryCoverage(environment) {
  const known = new Set([
    ...providers.flatMap((provider) => provider.env),
    ...Object.keys(retiredVariables),
  ])
  const unknown = Object.keys(environment).filter(
    (key) =>
      /^VITE_(SPEECH_ENGINE|SPEECH_RECOGNITION_ENGINE|TRANSLATION_ENGINE)_/.test(
        key,
      ) &&
      environment[key]?.trim() &&
      !known.has(key),
  )
  if (unknown.length)
    throw new Error(
      'Configured provider variables have no app test: ' + unknown.join(', '),
    )
}
module.exports = {
  providers,
  inventory,
  assertInventoryCoverage,
  retiredVariables,
}
