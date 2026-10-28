const assert = require('node:assert/strict')
const { journeyCases } = require('./journeys.cjs')
const { profileCases } = require('./profile-upgrades.cjs')
const coreCases = [
  'app: production boot and cross-process settings',
  'tts: Sam',
  'tts: Animalese',
  'tts: Windows voices',
  'shortcut: native messenger toggle and rebind',
  'shortcut: alternate messenger and overlay',
  'shortcut: saved message and profile',
  'shortcut: cancel current and cancel queued messages',
  'stt: push-to-record capture, PCM, indicator, and release',
  'stt: continuous detection and disabling microphone',
  ...journeyCases,
  ...profileCases,
  'persistence: save restart fixture',
  'persistence: configuration survives full application relaunch',
  'app: no uncaught errors or leaked capture processes',
]
function validateResults(results, expected) {
  const names = results.map((result) => result.name)
  assert.equal(new Set(names).size, names.length, 'Duplicate test results')
  assert.deepEqual(
    [...names].sort(),
    [...expected].sort(),
    'Missing or unexpected app test results',
  )
  assert.equal(
    results.filter((result) => result.pass !== true).length,
    0,
    'App tests failed; see coverage/app-results',
  )
}
function redactor(environment) {
  const values = Object.entries(environment)
    .filter(
      ([key, value]) =>
        value &&
        /(?:API_KEY|IDENTITY_POOL|SERVICE_ACCOUNT|ENCRYPTION_KEY|TOKEN)/.test(
          key,
        ),
    )
    .map(([, value]) => value)
  for (const [key, value] of Object.entries(environment))
    if (key.includes('SERVICE_ACCOUNT') && value)
      try {
        const account = JSON.parse(value)
        for (const property of [
          'private_key',
          'private_key_id',
          'client_email',
        ])
          if (account[property]) {
            values.push(account[property])
            values.push(
              ...account[property]
                .split('\n')
                .filter((line) => line.length > 16),
            )
          }
      } catch {}
  return (text) =>
    values
      .reduce(
        (result, value) => result.split(value).join('[REDACTED]'),
        String(text),
      )
      .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
}
function additionalCases(providers) {
  const cases = []
  if (
    providers.some((p) => p.id === 'matts') &&
    providers.some((p) => p.id === 'amazon-translate-translation')
  )
    cases.push('translation: Amazon Translate with Nanami Auto/Auto')
  if (
    providers.some((p) => p.kind === 'stt') &&
    providers.some((p) => p.kind === 'translation')
  )
    cases.push('stt: microphone recognition through translation and speech')
  if (providers.some((p) => p.id === 'matts'))
    cases.push('tts: Azure expressive style command')
  if (providers.some((p) => p.id === 'openai-tts'))
    cases.push('tts: OpenAI instructions and custom command')
  return cases
}
module.exports = { coreCases, validateResults, redactor, additionalCases }
