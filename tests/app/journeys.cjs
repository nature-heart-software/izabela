const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')

// These names are also the runner's required-result contract.
const journeyCases = [
  'messages: word mode and sentence send button',
  'messages: ordered playback and lifecycle events',
  'messages: recall, edit, and reuse recent text',
  'history: replay saved voice, copy, export, and delete',
  'dictionary: expand, disable, edit, and remove replacements',
  'commands: keyboard autocomplete and integration metadata',
  'phrases: create, edit, play, and delete through UI',
  'profiles: create, rename, apply, and delete through UI',
  'desktop: draft retention, clear on hide, and submission behavior',
  'desktop: native focus return and close without quitting',
  'settings: themes, keyboard zoom, and About runtime information',
  'tts: custom catalog, selected voice, and buffered audio',
  'tts: universal endpoint and credential routing',
  'translation: custom endpoint, language options, and disable',
  'integrations: external say, audio playback, and cancellation',
  'stt: custom PCM round trip and recognition restart',
  'recovery: failed synthesis and translation followed by working requests',
  'cache: reuse, clear from General, and regenerate without data loss',
  'voices: search, favorite, select preset, and personalize Sam',
  'desktop: drag messenger and retain placement after reopening',
  'help: guided tour and release update policy',
]

async function runJourneys(context) {
  const {
    BrowserWindow,
    clipboard,
    ClipboardItem,
    dialog,
  } = require('electron')
  const {
    check,
    evaluate,
    patch,
    read,
    until,
    sleep,
    worker,
    messenger,
    events,
    selectTts,
    audioMessage,
    submit,
    press,
    socket,
    config,
    captures,
  } = context
  const run = (index, fn) =>
    check(journeyCases[index], async () => {
      await selectTts('samtts')
      await show()
      try {
        await fn()
      } finally {
        await patch('settings', {
          enableSTTTS: false,
          enableTranslation: false,
          messageMode: 'sentence',
          hideWindowOnMessage: false,
        })
        if (await read('playing-message', 'isPlaying')) await press(17)
      }
    })
  const inputSelector =
    '[data-v-step="messenger-text-input"] input, input[data-v-step="messenger-text-input"]'
  const input = () =>
    evaluate(
      messenger,
      (selector) => document.querySelector(selector).value,
      inputSelector,
    )
  const type = (value, selector = inputSelector) =>
    evaluate(
      messenger,
      (selector, value) => {
        const el = document.querySelector(selector)
        if (!el) throw new Error('Missing input ' + selector)
        el.focus()
        el.value = value
        el.dispatchEvent(new Event('input', { bubbles: true }))
      },
      selector,
      value,
    )
  const key = async (keyCode, modifiers = []) => {
    messenger.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode,
      modifiers,
    })
    messenger.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await sleep(100)
  }
  const show = async () => {
    if (!(await read('messenger-window', 'isShown'))) await press(14)
    await until(() => messenger.isVisible(), 'messenger visible')
  }
  const route = async (value, text) => {
    await show()
    await evaluate(messenger, () => {
      location.hash = '/'
    })
    await sleep(150)
    await evaluate(
      messenger,
      (section) => {
        document.querySelector('[data-v-step="' + section + '-button"]').click()
      },
      value.startsWith('/messages') ? 'messages' : 'settings',
    )
    await until(
      () =>
        evaluate(
          messenger,
          (value) =>
            Boolean(document.querySelector('a[href="#' + value + '"]')),
          value,
        ),
      'navigation link ' + value,
    )
    await evaluate(
      messenger,
      (value) => document.querySelector('a[href="#' + value + '"]').click(),
      value,
    )
    await until(
      () =>
        evaluate(
          messenger,
          (text) => document.body.innerText.includes(text),
          text,
        ),
      'route ' + value,
    )
    await sleep(100)
  }
  const clickText = async (text) => {
    await evaluate(
      messenger,
      (text) => {
        const button = [
          ...document.querySelectorAll(
            'button, [role="menuitem"], .option__content',
          ),
        ].find((el) => el.textContent.trim() === text)
        if (!button) throw new Error('Missing action ' + text)
        button.click()
      },
      text,
    )
    await sleep(150)
  }
  // Locate rendered component roots without exporting test hooks in production.
  await evaluate(messenger, () => {
    const find = (vnode, predicate) => {
      if (!vnode) return
      const c = vnode.component
      if (c && predicate(c)) return c
      const nested = c && find(c.subTree, predicate)
      if (nested) return nested
      if (Array.isArray(vnode.children))
        for (const child of vnode.children) {
          const found = find(child, predicate)
          if (found) return found
        }
    }
    const component = (name, id) => {
      const found = find(
        document.querySelector('#app')._vnode,
        (c) =>
          (c.type.__name === name || c.type.name === name) &&
          (!id || c.props.id === id),
      )
      if (found) return found
      throw new Error('Rendered component missing: ' + name + ' ' + (id || ''))
    }
    window.__appTest.component = (name, id) => component(name, id).subTree.el
    window.__appTest.action = (name, id, icon) => {
      const found = find(
        component(name, id).subTree,
        (c) => c.props.iconName === icon,
      )
      if (!found) throw new Error('Missing action icon ' + icon)
      return found.subTree.el
    }
  })
  const componentClick = async (name, id, index) => {
    await until(
      () =>
        evaluate(
          messenger,
          (name, id) => {
            try {
              return Boolean(window.__appTest.component(name, id))
            } catch {
              return false
            }
          },
          name,
          id,
        ),
      'component ' + name,
    )
    await evaluate(
      messenger,
      (name, id, index) => {
        const root = window.__appTest.component(name, id)
        const button =
          typeof index === 'string'
            ? window.__appTest.action(name, id, index)
            : root.querySelectorAll('button')[index]
        if (!button) throw new Error('Missing button ' + name + ':' + index)
        button.click()
      },
      name,
      id,
      index,
    )
    await sleep(150)
  }
  const complete = async (start, engine = 'samtts') => {
    const first = await until(
      () =>
        events
          .slice(start)
          .find(
            (e) => e.name === 'message:start' && e.payload?.engine === engine,
          ),
      'playback ' + engine,
      30000,
    )
    await until(
      () =>
        events
          .slice(start)
          .find(
            (e) =>
              e.name === 'message:end' && e.payload?.id === first.payload.id,
          ),
      'playback ended',
      30000,
    )
    assert.ok(
      !events.slice(start).some((e) => e.name === 'message:error'),
      'Playback failed',
    )
    return first.payload
  }
  const onTrigger = async (trigger, engine) => {
    const start = events.length
    await trigger()
    return complete(start, engine)
  }

  // A controlled service exercises the app's real HTTP adapters, not SDK mocks.
  const requests = []
  let failSpeech = false
  let failTranslation = false
  const source = fs.readFileSync(path.join(__dirname, 'fixtures/speech.wav'))
  let dataOffset = 12
  while (source.toString('ascii', dataOffset, dataOffset + 4) !== 'data') {
    const length = source.readUInt32LE(dataOffset + 4)
    dataOffset += 8 + length + (length % 2)
  }
  const wav = Buffer.from(source.subarray(0, dataOffset + 8 + 32000 * 2))
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.writeUInt32LE(wav.length - dataOffset - 8, dataOffset + 4)
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') {
      res.end()
      return
    }
    let body = ''
    for await (const chunk of req) body += chunk
    const entry = {
      url: req.url,
      headers: req.headers,
      body: body ? JSON.parse(body) : {},
    }
    requests.push(entry)
    if (req.url.includes('list-regions')) {
      res.setHeader('Content-Type', 'application/json')
      res.end('[]')
    } else if (req.url.includes('list-voices')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify(
          req.url.includes('amazon-polly')
            ? [
                {
                  Id: 'Joanna',
                  Name: 'Joanna',
                  LanguageCode: 'en-US',
                  SupportedEngines: ['standard'],
                },
              ]
            : [
                { name: 'Fixture voice', languageCode: 'en-US' },
                { name: 'Second fixture voice', languageCode: 'fr-FR' },
              ],
        ),
      )
    } else if (req.url.endsWith('/translate')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = failTranslation ? 503 : 200
      res.end(
        JSON.stringify(
          failTranslation
            ? { error: 'Controlled translation outage' }
            : 'Bonjour renard.',
        ),
      )
    } else if (req.url === '/export.wav') {
      res.setHeader('Content-Type', 'audio/wav')
      res.end(fs.readFileSync(path.join(config.directory, 'export.wav')))
    } else if (
      req.url === '/audio.wav' ||
      req.url.includes('synthesize-speech')
    ) {
      res.statusCode = failSpeech && req.url !== '/audio.wav' ? 503 : 200
      res.setHeader(
        'Content-Type',
        res.statusCode === 200 ? 'audio/wav' : 'application/json',
      )
      res.end(
        res.statusCode === 200
          ? wav
          : JSON.stringify({ error: 'Controlled speech outage' }),
      )
    } else {
      res.statusCode = 404
      res.end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const endpoint = 'http://127.0.0.1:' + server.address().port
  // Materialize lazy clipboard entries before any copy action replaces them.
  const originalClipboard = await Promise.all(
    (
      await clipboard.read()
    ).map(async (item) => {
      const data = {}
      for (const type of item.types) data[type] = await item.getType(type)
      return new ClipboardItem(data)
    }),
  )
  try {
    await selectTts('samtts')
    await show()
    await run(0, async () => {
      await patch('settings', { messageMode: 'word' })
      await onTrigger(async () => {
        await type('Hello')
        await key('Space')
      })
      assert.equal(await input(), '')
      await onTrigger(async () => {
        await type('World')
        await key('Space')
      })
      await patch('settings', { messageMode: 'sentence' })
      const message = await onTrigger(async () => {
        await type('Sentence from the send button.')
        await evaluate(messenger, () =>
          document
            .querySelector('[data-v-step="messenger-text-input-submit"]')
            .click(),
        )
      })
      assert.equal(message.originalMessage, 'Sentence from the send button.')
    })
    await run(1, async () => {
      const start = events.length
      for (const text of [
        'First queue item.',
        'Second queue item.',
        'Third queue item.',
      ])
        await submit(text)
      await until(
        () =>
          events.slice(start).filter((e) => e.name === 'message:end').length ===
          3,
        'ordered queue completion',
        30000,
      )
      const life = events
        .slice(start)
        .filter((e) => ['message:start', 'message:end'].includes(e.name))
      assert.deepEqual(
        life.map((e) => e.name),
        [
          'message:start',
          'message:end',
          'message:start',
          'message:end',
          'message:start',
          'message:end',
        ],
      )
      assert.deepEqual(
        life
          .filter((e) => e.name === 'message:start')
          .map((e) => e.payload.originalMessage),
        ['First queue item.', 'Second queue item.', 'Third queue item.'],
      )
      assert.ok(
        events.slice(start).some((e) => e.name === 'message:timeupdate'),
        'Missing integration timing events',
      )
    })
    await run(2, async () => {
      await type('')
      await key('Up')
      assert.equal(await input(), 'Third queue item.')
      await key('Up')
      assert.equal(await input(), 'Second queue item.')
      await key('Down')
      assert.equal(await input(), 'Third queue item.')
      await key('Down')
      assert.equal(await input(), '')
      await key('Up')
      await audioMessage((await input()) + ' Edited.', 'samtts')
      assert.equal(
        (await read('messages', 'history')).at(-1).originalMessage,
        'Third queue item. Edited.',
      )
    })
    await run(3, async () => {
      const message = (await read('messages', 'history')).at(-1)
      const savedVoice = message.voice
      await selectTts('animalesetts')
      await route('/messages/history', 'Last 50 messages')
      const replay = await onTrigger(() =>
        componentClick('NvHistoryMessage', message.id, 0),
      )
      assert.deepEqual(replay.voice, savedVoice)
      await componentClick('NvHistoryMessage', message.id, 1)
      await clickText('Copy text')
      await until(
        async () => (await clipboard.readText()) === message.originalMessage,
        'history copied text',
      )
      const destination = path.join(config.directory, 'export.wav')
      const originalSave = dialog.showSaveDialog
      let options
      dialog.showSaveDialog = async (_window, value) => {
        options = value
        return { canceled: false, filePath: destination }
      }
      try {
        await componentClick('NvHistoryMessage', message.id, 1)
        await clickText('Download')
        await until(() => fs.existsSync(destination), 'exported speech file')
        assert.equal(options.title, 'Save file')
        const bytes = fs.readFileSync(destination)
        assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
        const start = events.length
        socket.emit('audio:play', endpoint + '/export.wav')
        await complete(start, 'external-audio')
      } finally {
        dialog.showSaveDialog = originalSave
      }
      await componentClick('NvHistoryMessage', message.id, 1)
      await clickText('Delete')
      await until(
        async () =>
          !(await read('messages', 'history')).some((m) => m.id === message.id),
        'history deletion',
      )
      await selectTts('samtts')
    })
    await run(4, async () => {
      await patch('dictionary', {
        definitions: [['brb', 'hello friend']],
        enableDictionary: true,
      })
      await audioMessage('brb', 'samtts', (m) =>
        assert.equal(m.payload.text, 'hello friend'),
      )
      await patch('dictionary', { enableDictionary: false })
      await audioMessage('brb', 'samtts', (m) =>
        assert.equal(m.payload.text, 'brb'),
      )
      await patch('dictionary', {
        enableDictionary: true,
        definitions: [['brb', 'good morning']],
      })
      await audioMessage('brb', 'samtts', (m) =>
        assert.equal(m.payload.text, 'good morning'),
      )
      await patch('dictionary', { definitions: [] })
      await audioMessage('brb', 'samtts', (m) =>
        assert.equal(m.payload.text, 'brb'),
      )
    })
    await run(5, async () => {
      await patch('speech', {
        customCommands: [
          { name: 'Greeting', value: 'greeting', description: 'Speak warmly' },
        ],
      })
      await type('')
      await key('Tab')
      assert.equal(await input(), '/')
      const start = events.length
      await key('Down')
      await key('Enter')
      assert.equal(await input(), '/greeting ')
      assert.ok(
        !events.slice(start).some((e) => e.name === 'message:start'),
        'Autocomplete submitted speech',
      )
      await audioMessage('/greeting Hello.', 'samtts', (m) => {
        assert.equal(m.command, 'greeting')
        assert.equal(m.customCommand.description, 'Speak warmly')
        assert.equal(m.message, 'Hello.')
      })
      await patch('speech', { customCommands: [] })
    })
    await run(6, async () => {
      await route('/messages/shortcuts', 'Add shortcut')
      await clickText('Add shortcut')
      const message = (await read('messages', 'shortcutMessages'))[0]
      await evaluate(
        messenger,
        (id) => {
          const el = window.__appTest
            .component('NvShortcutMessage', id)
            .querySelector('input')
          el.value = 'A saved phrase.'
          el.dispatchEvent(new Event('input', { bubbles: true }))
        },
        message.id,
      )
      await sleep(350)
      const spoken = await onTrigger(() =>
        componentClick('NvShortcutMessage', message.id, 0),
      )
      assert.equal(spoken.message, 'A saved phrase.')
      await evaluate(
        messenger,
        (id) => {
          const el = window.__appTest
            .component('NvShortcutMessage', id)
            .querySelector('input')
          el.value = 'Edited saved phrase.'
          el.dispatchEvent(new Event('input', { bubbles: true }))
        },
        message.id,
      )
      await sleep(350)
      assert.equal(
        (
          await onTrigger(() =>
            componentClick('NvShortcutMessage', message.id, 0),
          )
        ).message,
        'Edited saved phrase.',
      )
      await componentClick('NvShortcutMessage', message.id, 'ellipsis-v')
      await clickText('Delete')
      assert.ok(
        !(await read('messages', 'shortcutMessages')).some(
          (m) => m.id === message.id,
        ),
      )
    })
    await run(7, async () => {
      await route('/settings/profiles', 'Add profile')
      const oldIds = await evaluate(messenger, () =>
        window.__appTest.store('profiles').profiles.map((p) => p.id),
      )
      await clickText('Add profile')
      const profile = await until(
        () =>
          evaluate(
            messenger,
            (oldIds) => {
              const profile = window.__appTest
                .store('profiles')
                .profiles.find((p) => !oldIds.includes(p.id))
              return profile ? JSON.parse(JSON.stringify(profile)) : null
            },
            oldIds,
          ),
        'new profile in UI',
      )
      await type('Renamed profile', 'input[placeholder="Profile name"]')
      await sleep(350)
      // Change the selected engine through shared settings while leaving the
      // profile editor mounted, then apply the saved configuration from its card.
      await patch('settings', { selectedSpeechEngine: 'animalesetts' })
      await until(
        () =>
          evaluate(
            messenger,
            () =>
              window.__appTest.store('settings').selectedSpeechEngine ===
              'animalesetts',
          ),
        'engine changed before profile apply',
      )
      await componentClick('NvProfileCard', profile.id, 0)
      await until(
        async () =>
          (await read('settings', 'selectedSpeechEngine')) === 'samtts',
        'saved profile restored engine',
      )
      await audioMessage('Profile voice restored.', 'samtts')
      assert.equal(
        (await read('profiles', 'profiles'))[0].name,
        'Renamed profile',
      )
      await componentClick('NvProfileCard', profile.id, 'ellipsis-v')
      await clickText('Delete')
      assert.ok(
        !(await read('profiles', 'profiles')).some((p) => p.id === profile.id),
      )
    })
    await run(8, async () => {
      await patch('settings', {
        clearMessageOnWindowHide: false,
        hideWindowOnMessage: false,
      })
      await type('Unsent draft')
      await key('Escape')
      await until(() => !messenger.isVisible(), 'Escape hides messenger')
      await show()
      assert.equal(await input(), 'Unsent draft')
      await patch('settings', { clearMessageOnWindowHide: true })
      await key('Escape')
      await until(() => !messenger.isVisible(), 'clear draft hide')
      await show()
      assert.equal(await input(), '')
      await patch('settings', { hideWindowOnMessage: true })
      await audioMessage('Hide after Enter.', 'samtts')
      assert.equal(messenger.isVisible(), false)
      await show()
      await onTrigger(async () => {
        await type('Send button stays visible.')
        await evaluate(messenger, () =>
          document
            .querySelector('[data-v-step="messenger-text-input-submit"]')
            .click(),
        )
      })
      assert.equal(messenger.isVisible(), true)
      await patch('settings', {
        clearMessageOnWindowHide: false,
        hideWindowOnMessage: false,
      })
    })
    await run(9, async () => {
      await type('')
      await key('Escape')
      await until(
        () => !messenger.isVisible(),
        'messenger hidden before foreground test',
      )
      const host = new BrowserWindow({
        width: 320,
        height: 180,
        show: true,
        title: 'E2E foreground target',
      })
      try {
        await host.loadURL(
          'data:text/html,<title>E2E foreground target</title><input autofocus>',
        )
        host.focus()
        await until(() => host.isFocused(), 'foreground target focused')
        await press(14)
        await until(
          async () => await read('messenger-window', 'isInputFocused'),
          'shortcut focuses text input',
        )
        await key('Escape')
        await until(() => host.isFocused(), 'foreground focus restored')
        await show()
        messenger.close()
        await until(() => !messenger.isVisible(), 'close hides app')
        assert.equal(messenger.isDestroyed(), false)
        assert.ok(!worker.isDestroyed())
        await show()
        await audioMessage('Still running after close.', 'samtts')
      } finally {
        host.destroy()
      }
    })
    await run(10, async () => {
      await route('/settings/general', 'Theme')
      for (const theme of ['dark', 'light']) {
        await patch('settings', { theme })
        await until(
          () =>
            evaluate(
              messenger,
              (theme) => window.__appTest.store('settings').theme === theme,
              theme,
            ),
          'theme preference synchronized',
        )
      }
      const zoom = messenger.webContents.getZoomLevel()
      await type('')
      await key('=', ['control'])
      await until(
        () => messenger.webContents.getZoomLevel() > zoom,
        'keyboard zoom in',
      )
      await key('-', ['control'])
      await until(
        () => messenger.webContents.getZoomLevel() === zoom,
        'keyboard zoom out',
      )
      await key('0', ['control'])
      await until(
        () => messenger.webContents.getZoomLevel() === 0,
        'keyboard zoom reset',
      )
      await route('/settings/about', 'Wiki')
      await until(
        () =>
          evaluate(
            messenger,
            (version) => document.body.innerText.includes(version),
            process.versions.electron,
          ),
        'About Electron runtime version',
      )
    })
    await run(11, async () => {
      await patch('plugin-customtts', {
        pluginState: {
          endpoint,
          selectedVoice: null,
          useCacheOnEveryRequest: false,
        },
      })
      await selectTts('customtts')
      const m = await onTrigger(
        () => submit('Controlled custom speech.'),
        'customtts',
      )
      assert.equal(m.voice.name, 'Fixture voice')
      assert.ok(requests.some((r) => r.url === '/list-voices'))
      const req = requests.findLast((r) => r.url === '/synthesize-speech')
      assert.equal(req.body.payload.text, 'Controlled custom speech.')
      assert.equal(req.body.payload.voice.name, 'Fixture voice')
    })
    await run(12, async () => {
      // The form performs the same encryption used for user-entered API keys.
      await route('/settings/engine', 'Universal credentials')
      const apiKey = 'e2e-universal-key'
      await evaluate(
        messenger,
        (endpoint, apiKey) => {
          const form = window.__appTest.component('NvUniversalApiForm')
          const inputs = form.querySelectorAll('input')
          for (const [el, value] of [
            [inputs[0], apiKey],
            [inputs[1], endpoint],
          ]) {
            el.value = value
            el.dispatchEvent(new Event('input', { bubbles: true }))
          }
        },
        endpoint,
        apiKey,
      )
      await patch('plugin-aptts', {
        pluginState: {
          useLocalCredentials: false,
          streamAudio: false,
          selectedVoice: {
            Id: 'Joanna',
            Name: 'Joanna',
            LanguageCode: 'en-US',
            SupportedEngines: ['standard'],
          },
        },
      })
      await selectTts('aptts')
      await patch('plugin-aptts', {
        pluginState: { useLocalCredentials: false },
      })
      const start = requests.length
      await audioMessage('Universal routing check.', 'aptts')
      const req = requests
        .slice(start)
        .find((r) => r.url.includes('amazon-polly/synthesize-speech'))
      assert.ok(req, 'Universal endpoint was bypassed')
      assert.deepEqual(req.body.credentials, {})
      assert.ok(
        Object.values(req.headers).some((v) => String(v).includes(apiKey)),
        'Universal key missing from request',
      )
      await selectTts('izabelatts')
      await audioMessage('Izabela universal voice check.', 'izabelatts')
      const izabela = requests.findLast((r) =>
        r.url.includes('/tts/izabela/synthesize-speech'),
      )
      assert.equal(izabela.headers.authorization, 'Bearer ' + apiKey)
      await patch('settings', { universalApiKey: '', universalApiEndpoint: '' })
      await selectTts('samtts')
    })
    await run(13, async () => {
      await patch('plugin-custom-translation', {
        pluginState: { endpoint, translateFrom: 'en', translateTo: 'fr' },
      })
      await patch('settings', {
        selectedTranslationEngine: 'custom-translation',
        enableTranslation: true,
      })
      await route('/settings/translation', 'API Key')
      await type('e2e-translation', '.settings input[type="password"]')
      await audioMessage('Hello fox.', 'samtts', (m) =>
        assert.equal(m.translatedMessage, 'Bonjour renard.'),
      )
      const req = requests.findLast((r) => r.url === '/translate')
      assert.deepEqual(req.body.payload, {
        text: 'Hello fox.',
        from: 'en',
        to: 'fr',
      })
      await patch('settings', { enableTranslation: false })
      await audioMessage('Hello fox.', 'samtts', (m) =>
        assert.equal(m.translatedMessage, null),
      )
    })
    await run(14, async () => {
      const said = await onTrigger(() =>
        socket.emit('say', 'External say request.'),
      )
      assert.equal(said.originalMessage, 'External say request.')
      await onTrigger(
        () => socket.emit('audio:play', endpoint + '/audio.wav'),
        'external-audio',
      )
      const start = events.length
      socket.emit('audio:play', endpoint + '/audio.wav')
      await until(
        () => events.slice(start).some((e) => e.name === 'message:start'),
        'external audio started',
      )
      await press(17)
      await until(
        async () => !(await read('playing-message', 'isPlaying')),
        'external cancellation',
      )
    })
    await run(15, async () => {
      await patch('settings', {
        selectedSpeechRecognitionEngine: 'custom-speech-recognition',
        speechRecognitionStrategy: 'ptr',
        enableSTTTS: true,
      })
      await until(
        () => captures.some((c) => !c.closed),
        'custom recording process',
      )
      const previous = captures.length
      await evaluate(messenger, () =>
        window.ElectronSpeechWorkerWindow.restartNativeSpeechRecognition(),
      )
      await until(
        () =>
          captures.length > previous &&
          captures.at(-1).bytes > 0 &&
          !captures.at(-1).closed,
        'restarted recorder has PCM',
      )
      await sleep(600)
      const start = events.length
      context.keyEvent(129, 0, 0, 0)
      try {
        await until(
          () =>
            events
              .slice(start)
              .some((e) => e.name === 'speech:recording:data:chunk'),
          'custom PCM chunks after restart',
        )
      } finally {
        context.keyEvent(129, 0, 2, 0)
      }
      await until(
        () =>
          events
            .slice(start)
            .some((e) => e.name === 'speech:recording:data:end'),
        'custom audio export after restart',
      )
      assert.ok(
        events
          .slice(start)
          .some((e) => e.name === 'speech:recording:data:chunk'),
      )
      // An external recognizer returns text through the documented say interface.
      await onTrigger(() => socket.emit('say', 'Custom recognized speech.'))
      await patch('settings', { enableSTTTS: false })
      await until(() => captures.every((c) => c.closed), 'recording cleanup')
    })
    await run(16, async () => {
      await selectTts('customtts')
      failSpeech = true
      const start = events.length
      await submit('This request will fail.')
      await until(
        () => events.slice(start).some((e) => e.name === 'message:error'),
        'visible synthesis failure',
      )
      failSpeech = false
      await audioMessage('Recovered speech.', 'customtts')
      await selectTts('samtts')
      failTranslation = true
      await patch('settings', {
        enableTranslation: true,
        selectedTranslationEngine: 'custom-translation',
      })
      await audioMessage('Fallback is observable.', 'samtts', (m) =>
        assert.equal(m.translatedMessage, 'Fallback is observable.'),
      )
      failTranslation = false
      await audioMessage('Recovered translation.', 'samtts', (m) =>
        assert.equal(m.translatedMessage, 'Bonjour renard.'),
      )
      await patch('settings', { enableTranslation: false })
    })
    await run(17, async () => {
      await patch('plugin-customtts', {
        pluginState: { useCacheOnEveryRequest: true },
      })
      await selectTts('customtts')
      await patch('plugin-customtts', {
        pluginState: { useCacheOnEveryRequest: true },
      })
      const count = () =>
        requests.filter((r) => r.url === '/synthesize-speech').length
      const before = count()
      await audioMessage('Cache this phrase.', 'customtts')
      await audioMessage('Cache this phrase.', 'customtts')
      assert.equal(count(), before + 1, 'Repeated phrase bypassed cache')
      const history = await read('messages', 'history')
      const profiles = await read('profiles', 'profiles')
      await route('/settings/general', 'Clear cache')
      await clickText('Clear cache')
      await until(
        () =>
          evaluate(messenger, () =>
            document.body.innerText.includes('Cache cleared'),
          ),
        'clear cache success',
      )
      assert.deepEqual(await read('messages', 'history'), history)
      assert.deepEqual(await read('profiles', 'profiles'), profiles)
      await audioMessage('Cache this phrase.', 'customtts')
      assert.equal(count(), before + 2)
      await selectTts('samtts')
    })
    await run(18, async () => {
      const selector = '[data-v-step="engine-voice-select"] input'
      await type('Elf', selector)
      await until(
        () =>
          evaluate(messenger, () =>
            Boolean(document.querySelector('[title="Elf"]')),
          ),
        'voice search result',
      )
      await evaluate(messenger, () => {
        const option = document.querySelector('[title="Elf"]')
        option.dispatchEvent(new MouseEvent('mouseenter'))
      })
      await sleep(100)
      await evaluate(messenger, () => {
        document
          .querySelector('[title="Elf"] button[title="Add to favorites"]')
          .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
      await until(
        () =>
          evaluate(messenger, () =>
            window.__appTest
              .store('plugin-samtts')
              .pluginState.favoriteVoiceIds.includes('Elf'),
          ),
        'voice favorite saved',
      )
      await evaluate(messenger, () =>
        document
          .querySelector('[title="Elf"]')
          .dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
      )
      await audioMessage('Hello from the elf.', 'samtts', (m) =>
        assert.equal(m.voice.name, 'Elf'),
      )
      await type('Custom', selector)
      await until(
        () =>
          evaluate(messenger, () =>
            Boolean(document.querySelector('[title="Custom"]')),
          ),
        'custom voice option',
      )
      await evaluate(messenger, () =>
        document
          .querySelector('[title="Custom"]')
          .dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
      )
      await route('/settings/engine', 'Universal credentials')
      await clickText('Sam')
      await type('140', '.settings input[type="range"]')
      await audioMessage('A personalized voice.', 'samtts', (m) => {
        assert.equal(m.voice.name, 'Custom')
        assert.equal(m.voice.pitch, 140)
      })
      await patch('plugin-samtts', {
        pluginState: {
          selectedVoice: {
            name: 'Default',
            speed: 72,
            speech: 64,
            throat: 128,
            mouth: 128,
          },
        },
      })
    })
    await run(19, async () => {
      await evaluate(messenger, () => {
        location.hash = '/'
      })
      await type('')
      const before = await read('messenger', 'position')
      const rect = await evaluate(messenger, () => {
        const r = document
          .querySelector('.moveable-handle')
          .getBoundingClientRect()
        return {
          x: Math.round(r.x + r.width / 2),
          y: Math.round(r.y + r.height / 2),
        }
      })
      messenger.webContents.sendInputEvent({
        type: 'mouseDown',
        button: 'left',
        clickCount: 1,
        ...rect,
      })
      messenger.webContents.sendInputEvent({
        type: 'mouseMove',
        x: rect.x + 40,
        y: rect.y - 30,
        button: 'left',
        modifiers: ['leftButtonDown'],
      })
      messenger.webContents.sendInputEvent({
        type: 'mouseUp',
        button: 'left',
        clickCount: 1,
        x: rect.x + 40,
        y: rect.y - 30,
      })
      await until(
        async () =>
          (await read('messenger', 'position')).transform !== before.transform,
        'messenger dragged',
      )
      const after = await read('messenger', 'position')
      await type('')
      await key('Escape')
      await until(() => !messenger.isVisible(), 'hide moved messenger')
      await show()
      assert.deepEqual(await read('messenger', 'position'), after)
    })
    await run(20, async () => {
      await componentClick(
        'NvMessengerNavigationBar',
        undefined,
        'question-circle',
      )
      await until(
        () =>
          evaluate(messenger, () =>
            document.body.innerText.includes('You can input any message'),
          ),
        'guided tour opened',
      )
      await clickText('Next')
      await until(
        () =>
          evaluate(messenger, () =>
            document.body.innerText.includes('You can send the message'),
          ),
        'guided tour next step',
      )
      await clickText('Close')
      await route('/settings/general', 'Updates are disabled for this build.')
      await patch('settings', { enableAutoUpdate: true })
      const text = await evaluate(messenger, () => document.body.innerText)
      assert.ok(
        !text.includes('Update channel'),
        'Disabled build exposes update-channel controls',
      )
      assert.equal(
        await read('settings', 'enableAutoUpdate'),
        true,
        'Build policy overwrote user preference',
      )
      await patch('settings', { enableAutoUpdate: false })
    })
  } finally {
    failSpeech = false
    failTranslation = false
    if (originalClipboard.length) await clipboard.write(originalClipboard)
    else clipboard.clear()
    await patch('settings', {
      enableSTTTS: false,
      enableTranslation: false,
      messageMode: 'sentence',
      hideWindowOnMessage: false,
      universalApiKey: '',
      universalApiEndpoint: '',
    })
    await selectTts('samtts')
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
}
module.exports = { journeyCases, runJourneys }
