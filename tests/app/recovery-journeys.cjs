const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { generateKeyPairSync } = require('node:crypto')
const recoveryCases = [
  'queue: cancel delayed synthesis without late playback',
  'queue: cancel all prefetched speech and recover after queued failure',
  'stt: disable while held and restart without duplicate capture',
  'catalog: authenticated language options refresh after credential and endpoint changes',
  'credentials: canceled and invalid imports preserve a working account',
]
async function runRecovery(c) {
  const {
    check,
    patch,
    read,
    until,
    sleep,
    events,
    submit,
    press,
    selectTts,
    audioMessage,
    evaluate,
    messenger,
    worker,
    requests,
    endpoint,
    holds,
    route,
    type,
    clickText,
    dialog,
  } = c
  const context = c
  const run = (index, fn) =>
    check(recoveryCases[index], async () => {
      await selectTts('samtts')
      try {
        await fn()
      } finally {
        holds.forEach((held) => held.release())
        holds.clear()
        await patch('settings', {
          enableSTTTS: false,
          enableTranslation: false,
        })
        await press(17)
      }
    })
  const hold = (text) => {
    let release
    const promise = new Promise((r) => {
      release = r
    })
    holds.set(text, { promise, release })
    return release
  }
  const waitLoad = (start, text) =>
    until(
      () =>
        events
          .slice(start)
          .find(
            (e) =>
              e.name === 'message:load' && e.payload.originalMessage === text,
          ),
      text + ' loaded',
    )
  const starts = (start) =>
    events
      .slice(start)
      .filter((e) => e.name === 'message:start')
      .map((e) => e.payload.originalMessage)
  const configure = async () => {
    await patch('plugin-customtts', {
      pluginState: { endpoint, useCacheOnEveryRequest: false },
    })
    await selectTts('customtts')
  }
  await run(0, async () => {
    await configure()
    const release = hold('Delayed canceled speech.')
    const start = events.length
    await submit('Delayed canceled speech.')
    await waitLoad(start, 'Delayed canceled speech.')
    await submit('Next queued speech.')
    await press(16)
    await until(
      () => starts(start).includes('Next queued speech.'),
      'next queued speech starts',
    )
    release()
    await sleep(700)
    assert.ok(!starts(start).includes('Delayed canceled speech.'))
    await until(
      () =>
        events
          .slice(start)
          .some(
            (e) =>
              e.name === 'message:end' &&
              e.payload.originalMessage === 'Next queued speech.',
          ),
      'next queued speech ends',
    )
    assert.equal(
      events
        .slice(start)
        .filter(
          (e) =>
            e.name === 'message:end' &&
            e.payload.originalMessage === 'Delayed canceled speech.',
        ).length,
      1,
    )
  })
  await run(1, async () => {
    await configure()
    const a = hold('Cancel prefetched A.'),
      b = hold('Cancel prefetched B.')
    let start = events.length
    await submit('Cancel prefetched A.')
    await waitLoad(start, 'Cancel prefetched A.')
    await submit('Cancel prefetched B.')
    await until(
      () =>
        requests.some((r) => r.body.payload?.text === 'Cancel prefetched B.'),
      'B prefetch reaches service',
    )
    await press(17)
    a()
    b()
    await sleep(600)
    assert.deepEqual(starts(start), [])
    await audioMessage('After cancel all.', 'customtts')
    const release = hold('Queue blocker.')
    start = events.length
    await submit('Queue blocker.')
    await waitLoad(start, 'Queue blocker.')
    await submit('Queued failure.')
    await submit('After queued failure.')
    release()
    await until(
      () => starts(start).includes('After queued failure.'),
      'queue survives prefetch failure',
    )
    await until(
      () =>
        events
          .slice(start)
          .some(
            (e) =>
              e.name === 'message:end' &&
              e.payload.originalMessage === 'After queued failure.',
          ),
      'queue recovered',
    )
    assert.equal(
      events
        .slice(start)
        .filter(
          (e) =>
            e.name === 'message:error' &&
            e.payload.originalMessage === 'Queued failure.',
        ).length,
      1,
    )
    assert.equal(
      starts(start).filter((text) => text === 'After queued failure.').length,
      1,
    )
  })
  await run(2, async () => {
    await patch('settings', {
      selectedSpeechRecognitionEngine: 'custom-speech-recognition',
      speechRecognitionStrategy: 'ptr',
      enableSTTTS: true,
    })
    await until(
      () => context.captures.some((capture) => !capture.closed),
      'recorder running',
    )
    await sleep(700)
    const record = async () => {
      const start = events.length
      context.keyEvent(129, 0, 0, 0)
      await until(
        () =>
          events
            .slice(start)
            .some((e) => e.name === 'speech:recording:data:chunk'),
        'held shortcut produces PCM',
      )
    }
    try {
      await record()
      await patch('settings', { enableSTTTS: false })
      await until(
        async () => !(await read('speechRecognition', 'recording')),
        'disabled recorder clears held state',
      )
    } finally {
      context.keyEvent(129, 0, 2, 0)
    }
    await until(
      () => context.captures.every((capture) => capture.closed),
      'disabled capture stopped',
    )
    await patch('settings', { enableSTTTS: true })
    await until(
      () => context.captures.some((capture) => !capture.closed),
      'recorder re-enabled',
    )
    await sleep(700)
    try {
      await record()
      const previous = context.captures.length
      await evaluate(messenger, () =>
        window.ElectronSpeechWorkerWindow.restartNativeSpeechRecognition(),
      )
      await until(
        () =>
          context.captures.length > previous &&
          context.captures.at(-1).bytes > 0,
        'restart during held shortcut',
      )
      const start = events.length
      await until(
        () =>
          events
            .slice(start)
            .some((e) => e.name === 'speech:recording:data:chunk'),
        'new recorder resumes held shortcut',
      )
      await until(
        () =>
          context.captures.filter((capture) => !capture.closed).length === 1,
        'exactly one capture process',
      )
    } finally {
      context.keyEvent(129, 0, 2, 0)
    }
    await patch('settings', { enableSTTTS: false })
  })
  await run(3, async () => {
    await patch('plugin-custom-translation', {
      pluginState: { endpoint, translateFrom: null, translateTo: null },
    })
    await patch('settings', {
      selectedTranslationEngine: 'custom-translation',
      enableTranslation: true,
    })
    await route('/settings/translation', 'API Key')
    await type('catalog-key', '.settings input[type="password"]')
    await until(
      () =>
        requests.some(
          (r) =>
            r.url.endsWith('/languages') &&
            r.body.credentials?.apiKey === 'catalog-key',
        ),
      'authenticated language catalog',
    )
    const chooseFrench = async () => {
      await evaluate(messenger, () => {
        const el = window.__appTest.component('NvTranslateToSelect')
        el.querySelector('input').focus()
        el.querySelector('input').dispatchEvent(new Event('focus'))
        el.querySelector('input').click()
      })
      await until(
        () =>
          evaluate(messenger, () =>
            document.body.innerText.includes('Fixture French'),
          ),
        'catalog language shown',
      )
      assert.ok(
        !(await evaluate(messenger, () => document.body.innerText)).includes(
          'Stale French',
        ),
      )
      await evaluate(messenger, () => {
        const option = [...document.querySelectorAll('.option__content')].find(
          (el) => el.textContent.trim() === 'Fixture French',
        )
        if (!option) throw new Error('Missing French catalog option')
        option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
      await until(
        async () =>
          (
            await read('plugin-custom-translation', 'pluginState')
          ).translateTo === 'fr',
        'catalog option has valid language id',
      )
    }
    await chooseFrench()
    await type('replacement-key', '.settings input[type="password"]')
    await until(
      () =>
        requests.some(
          (r) =>
            r.url.endsWith('/languages') &&
            r.body.credentials?.apiKey === 'replacement-key',
        ),
      'catalog refresh after credential change',
    )
    const releaseCatalog = hold('/slow/languages')
    await patch('plugin-custom-translation', {
      pluginState: { endpoint: endpoint + '/slow' },
    })
    await until(
      () => requests.some((r) => r.url === '/slow/languages'),
      'delayed previous catalog',
    )
    await patch('plugin-custom-translation', {
      pluginState: { endpoint: endpoint + '/second' },
    })
    await until(
      () =>
        requests.some(
          (r) =>
            r.url === '/second/languages' &&
            r.body.credentials?.apiKey === 'replacement-key',
        ),
      'catalog refresh after endpoint change',
    )
    releaseCatalog()
    await sleep(300)
    await chooseFrench()
    await audioMessage('Catalog selected translation.', 'samtts', (m) =>
      assert.equal(m.translatedMessage, 'Bonjour renard.'),
    )
  })
  await run(4, async () => {
    const { app } = require('electron')
    const destination = path.join(
      app.getPath('userData'),
      'credentials/google-cloud-speech-credentials.json',
    )
    const previous = fs.existsSync(destination)
      ? fs.readFileSync(destination)
      : null
    const selected = path.join(c.config.directory, 'test-service-account.json')
    const originalDialog = dialog.showOpenDialog
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    const valid = JSON.stringify({
      type: 'service_account',
      project_id: 'fixture',
      client_email: 'fixture@example.invalid',
      private_key: privateKey,
    })
    try {
      await evaluate(messenger, () => {
        window.__credentialImportFixture = { errors: [], error: console.error }
        console.error = (...args) => {
          if (args[0] === 'Could not import Google Cloud credentials.')
            window.__credentialImportFixture.errors.push(args[0])
          window.__credentialImportFixture.error.apply(console, args)
        }
      })
      await patch('settings', {
        selectedSpeechRecognitionEngine: 'google-cloud-speech-recognition',
        enableSTTTS: false,
      })
      await route('/settings/audio-input', 'Import')
      fs.writeFileSync(selected, valid)
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selected],
      })
      await clickText('Import')
      await until(
        () =>
          fs.existsSync(destination) &&
          fs.readFileSync(destination, 'utf8') === valid,
        'valid account imported',
      )
      await until(
        () =>
          evaluate(messenger, () =>
            document.body.innerText.includes('Credentials found'),
          ),
        'credential UI refresh',
      )
      assert.ok(
        !(await evaluate(messenger, () => document.body.innerText)).includes(
          'Credentials not found',
        ),
      )
      dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] })
      await clickText('Import')
      assert.equal(fs.readFileSync(destination, 'utf8'), valid)
      fs.writeFileSync(selected, '{ invalid JSON')
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selected],
      })
      await clickText('Import')
      await until(
        () =>
          evaluate(
            messenger,
            () => window.__credentialImportFixture.errors.length === 1,
          ),
        'invalid credential import handled',
      )
      assert.equal(fs.readFileSync(destination, 'utf8'), valid)
      const recovered = valid.replace(
        'fixture@example.invalid',
        'recovered@example.invalid',
      )
      fs.writeFileSync(selected, recovered)
      await clickText('Import')
      await until(
        () => fs.readFileSync(destination, 'utf8') === recovered,
        'valid import succeeds after an invalid file',
      )
    } finally {
      await evaluate(messenger, () => {
        if (window.__credentialImportFixture) {
          console.error = window.__credentialImportFixture.error
          delete window.__credentialImportFixture
        }
      }).catch(() => {})
      dialog.showOpenDialog = originalDialog
      if (previous) fs.writeFileSync(destination, previous)
      else fs.rmSync(destination, { force: true })
      fs.rmSync(selected, { force: true })
    }
  })
}
module.exports = { recoveryCases, runRecovery }
