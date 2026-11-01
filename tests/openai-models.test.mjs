import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'
import express from 'express'
import loadTypescript from './load-typescript.cjs'

const app = new URL('../apps/app/', import.meta.url)
const sdk = createRequire(new URL('package.json', app))
const plugins = new URL('src/plugins/', app)
const stt = loadTypescript(
  fileURLToPath(
    new URL('speech-recognition-engines/openai/shared.ts', plugins),
  ),
)
const translation = loadTypescript(
  fileURLToPath(new URL('translation-engines/openai/shared.ts', plugins)),
)
const tts = loadTypescript(
  fileURLToPath(
    new URL(
      '../apps/app-server/src/plugins/speech-apis/openai.ts',
      import.meta.url,
    ),
  ),
  {
    '../../utils/requests': {
      handleError() {
        throw new Error('Unexpected route failure')
      },
    },
  },
)

function literals(resource, declaration, property) {
  const filename = sdk
    .resolve('openai/resources/' + resource)
    .replace(/\.js$/, '.d.ts')
  const source = ts.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const node = source.statements.find((node) => node.name?.text === declaration)
  assert.ok(node, 'SDK declaration missing: ' + declaration)
  const type = property
    ? node.members.find((member) => member.name?.text === property)?.type
    : node.type
  assert.ok(type, 'SDK type missing: ' + declaration + '.' + property)
  return type.types
    .filter(ts.isLiteralTypeNode)
    .map((node) => node.literal.text)
}
const sorted = (values) => [...values].sort()

test('speech model and voice routes include every built-in SDK choice', async (t) => {
  const serverApp = express()
  serverApp.use(express.json())
  tts.default({ app: serverApp })
  const server = serverApp.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  for (const [route, expected] of [
    ['list-models', literals('audio/speech', 'SpeechModel')],
    ['list-voices', literals('audio/speech', 'SpeechCreateParams', 'voice')],
  ]) {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/tts/openai/${route}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credentials: {} }),
      },
    )
    assert.equal(response.status, 200)
    const values = await response.json()
    assert.equal(new Set(values).size, values.length)
    assert.deepEqual(sorted(values), sorted(expected))
  }
  for (const model of ['tts-1', 'tts-1-hd']) {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/tts/openai/list-voices`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credentials: {}, model }),
      },
    )
    assert.equal(response.status, 200)
    assert.deepEqual(
      sorted(await response.json()),
      sorted([
        'alloy',
        'ash',
        'coral',
        'echo',
        'fable',
        'nova',
        'onyx',
        'sage',
        'shimmer',
      ]),
    )
  }
})

test('recognition choices track the SDK realtime transcription union', () => {
  assert.deepEqual(
    sorted(stt.models),
    sorted(literals('realtime/realtime', 'AudioTranscription', 'model')),
  )
  assert.ok(stt.models.includes(stt.defaultModel))
})

test('translation choices track SDK GPT text models compatible with Chat Completions', () => {
  // Official shutdowns through 2026-10-28; SDK unions retain historical names.
  const retired = new Set([
    'gpt-5.3-chat-latest',
    'gpt-5.2-chat-latest',
    'gpt-5.1-chat-latest',
    'gpt-5-chat-latest',
    'gpt-4.1-nano',
    'gpt-4.1-nano-2025-04-14',
    'gpt-4o-2024-05-13',
  ])
  const expected = literals('shared', 'ChatModel').filter(
    (model) =>
      /^gpt-(?:[56](?:[.-]|$)|4\.1(?:-|$)|4o(?:-|$))/.test(model) &&
      !/audio|search|codex|(?:-pro)(?:-|$)/.test(model) &&
      !retired.has(model),
  )
  assert.deepEqual(sorted(translation.models), sorted(expected))
  assert.ok(translation.models.includes(translation.defaultModel))
})

test('model selectors consume the same tested catalogs', () => {
  for (const kind of ['speech-recognition-engines', 'translation-engines']) {
    const source = readFileSync(
      new URL(kind + '/openai/NvModelSelect.vue', plugins),
      'utf8',
    )
    assert.match(source, /import \{ models \} from '\.\/shared'/)
    assert.match(source, /models\.map/)
  }
})

test('new transcription models use supported language and prompt fields', () => {
  for (const model of ['gpt-live-transcribe', 'gpt-transcribe']) {
    const options = stt.getTranscriptionOptions(
      model,
      'Names and terminology',
      'fr',
    )
    assert.deepEqual([...options.languages], ['fr'])
    assert.ok(!('language' in options))
    assert.equal(options.prompt, 'Names and terminology')
  }
  for (const model of ['gpt-realtime-whisper', 'gpt-4o-transcribe-diarize']) {
    const options = stt.getTranscriptionOptions(
      model,
      'Unsupported prompt',
      'en',
    )
    assert.ok(!('prompt' in options))
    assert.equal(options.language, 'en')
  }
  const legacy = stt.getTranscriptionOptions(
    'gpt-4o-transcribe',
    'Keep my prompt',
    'en',
  )
  assert.equal(legacy.prompt, 'Keep my prompt')
  assert.equal(legacy.language, 'en')
})
