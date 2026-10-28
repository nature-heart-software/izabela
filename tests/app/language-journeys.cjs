const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const samples = require('./fixtures/languages.json')
function languageCases(providers) {
  if (!providers.some((provider) => provider.id === 'matts')) return []
  return providers
    .filter((provider) => provider.kind === 'stt')
    .flatMap((provider) =>
      samples
        .filter(
          (sample) =>
            provider.id !== 'ibm-watson-speech-recognition' ||
            sample.language !== 'ar-SA',
        )
        .map((sample) => ({
          provider,
          sample,
          name: `stt language: ${provider.name} ${sample.language}`,
        })),
    )
}
const normalize = (text) =>
  String(text)
    .normalize('NFKD')
    .replace(/\p{M}|\s/gu, '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
async function runLanguages(c) {
  const {
    check,
    evaluate,
    patch,
    until,
    sleep,
    worker,
    events,
    selectTts,
    keyEvent,
    captures,
    setCaptureFixture,
  } = c
  for (const { provider, sample, name } of languageCases(c.config.providers)) {
    await check(name, async () => {
      try {
        await patch('settings', {
          enableSTTTS: false,
          enableTranslation: false,
        })
        await until(
          () => captures.every((capture) => capture.closed),
          'previous language capture closed',
        )
        const fixture = path.join(
          __dirname,
          'fixtures',
          sample.language + '.wav',
        )
        setCaptureFixture(fixture)
        // Speak the recognized language with a real matching Azure voice. This
        // checks the complete STT -> IPC -> speech path for non-Latin scripts.
        await selectTts('matts')
        await evaluate(
          worker,
          async (language, port) => {
            const engine = window.__appTest.store('speech').currentSpeechEngine
            const response = await fetch(
              `http://localhost:${port}/api/tts/microsoft-azure/list-voices`,
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ credentials: engine.getCredentials() }),
              },
            )
            if (!response.ok) throw Error('Language voice catalog failed')
            const voice = (await response.json()).find(
              (voice) => voice.Locale === language,
            )
            if (!voice) throw Error('Missing language voice: ' + language)
            window.__appTest
              .store('plugin-matts')
              .$patch({
                pluginState: { selectedVoice: voice, streamAudio: false },
              })
          },
          sample.language,
          process.env.VITE_SERVER_PORT || 7070,
        )
        await patch('settings', {
          selectedSpeechRecognitionEngine: provider.id,
          speechInputLanguage: sample.language,
          speechRecognitionStrategy: 'ptr',
          enableSTTTS: true,
        })
        await until(
          () =>
            captures.some((capture) => !capture.closed && capture.bytes > 0),
          'language PCM capture',
        )
        await sleep(150)
        const start = events.length
        keyEvent(129, 0, 0, 0)
        try {
          await sleep(1500 + ((fs.statSync(fixture).size - 44) / 32000) * 1000)
        } finally {
          keyEvent(129, 0, 2, 0)
        }
        const result = await until(
          async () =>
            events
              .slice(start)
              .find(
                (event) =>
                  event.name === 'message:start' &&
                  event.payload?.engine === 'matts',
              ),
          'non-English recognition result',
          60000,
        )
        const words = normalize(result.payload.message)
        const matches = sample.words.filter((word) =>
          words.includes(normalize(word)),
        ).length
        assert.ok(
          matches >= (sample.language === 'ja-JP' ? 1 : 2),
          `Transcript differs from ${sample.language} fixture: ${result.payload.message}`,
        )
        await until(
          () =>
            events
              .slice(start)
              .some(
                (event) =>
                  event.name === 'message:end' &&
                  event.payload?.id === result.payload.id,
              ),
          'non-English speech playback',
          30000,
        )
      } finally {
        keyEvent(129, 0, 2, 0)
        await patch('settings', {
          enableSTTTS: false,
          speechInputLanguage: 'en-US',
        })
        await until(
          () => captures.every((capture) => capture.closed),
          'language recorder released',
        )
        setCaptureFixture(path.join(__dirname, 'fixtures/speech.wav'))
      }
    })
  }
}
module.exports = { languageCases, runLanguages }
