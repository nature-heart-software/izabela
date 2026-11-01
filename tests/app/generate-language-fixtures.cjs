// Maintenance only: Infisical dev supplies Azure credentials. Tests themselves
// consume the checked-in PCM WAVs and never need synthesis to create their input.
const fs = require('node:fs')
const path = require('node:path')
const sdk = require('microsoft-cognitiveservices-speech-sdk')
const samples = [
  {
    language: 'fr-FR',
    text: 'Bonjour le monde. Ceci est un test de reconnaissance vocale.',
    words: ['bonjour', 'monde', 'reconnaissance', 'vocale'],
  },
  {
    language: 'ja-JP',
    text: 'こんにちは。これは音声認識のテストです。',
    words: ['こんにちは', '音声', '認識', 'テスト'],
  },
  {
    language: 'ar-SA',
    text: 'مرحبا بالعالم. هذا اختبار للتعرف على الكلام.',
    words: ['مرحبا', 'بالعالم', 'اختبار', 'الكلام'],
  },
]
async function run() {
  const config = sdk.SpeechConfig.fromSubscription(
    process.env.VITE_SPEECH_ENGINE_MICROSOFT_AZURE_API_KEY,
    process.env.VITE_SPEECH_ENGINE_MICROSOFT_AZURE_REGION,
  )
  config.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm
  for (const sample of samples) {
    const catalog = new sdk.SpeechSynthesizer(config, null)
    let voices
    try {
      voices = await catalog.getVoicesAsync(sample.language)
    } finally {
      catalog.close()
    }
    const voice = voices.voices.find((v) => v.locale === sample.language)
    if (!voice) throw Error('Missing fixture voice for ' + sample.language)
    config.speechSynthesisVoiceName = voice.shortName
    const synthesizer = new sdk.SpeechSynthesizer(config, null)
    try {
      const result = await new Promise((resolve, reject) =>
        synthesizer.speakTextAsync(sample.text, resolve, reject),
      )
      if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted)
        throw Error('Fixture synthesis failed for ' + sample.language)
      fs.writeFileSync(
        path.join(__dirname, 'fixtures', sample.language + '.wav'),
        Buffer.from(result.audioData),
      )
      sample.voice = voice.shortName
      console.log('Created ' + sample.language + ' PCM fixture')
    } finally {
      synthesizer.close()
    }
  }
  config.close()
  fs.writeFileSync(
    path.join(__dirname, 'fixtures/languages.json'),
    JSON.stringify(samples, null, 2) + '\n',
  )
}
if (require.main === module)
  run().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
