const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const profileCases = [
  'upgrade: legacy combined profile restores user data and fills new defaults',
  'upgrade: split profile preserves custom endpoints and user data',
  'upgrade: damaged settings are backed up without losing other stores',
]
function seedProfile(directory, phase) {
  const profile = path.join(directory, 'profile-' + phase)
  const stores = {
    'electron-pinia-settings': {
      enableSTTTS: false,
      enableTranslation: false,
      launchOnStartup: false,
      enableAutoUpdate: false,
      selectedSpeechEngine: 'samtts',
      theme: 'dark',
      universalApiEndpoint:
        phase === 'legacy'
          ? 'https://izabela-server-cdg1.vercel.app'
          : 'https://custom.example.invalid/v2/',
      universalApiKey: '',
      audioOutputs: [],
      preferredSavDir: null,
      keybindings: { toggleMessengerWindow: [] },
    },
    'electron-pinia-dictionary': {
      enableDictionary: true,
      definitions: [['old', 'preserved replacement']],
    },
    'electron-pinia-messages': {
      history: [
        {
          id: 'old-history',
          engine: 'samtts',
          message: 'Saved history',
          originalMessage: 'Saved history',
          payload: { text: 'Saved history' },
          voice: { name: 'Default', speed: 72 },
          createdAt: '2023-01-01T12:00:00.000Z',
        },
      ],
      shortcutMessages: [
        {
          id: 'old-phrase',
          message: 'Saved phrase',
          name: 'Old phrase',
          shortcut: [],
          speechEngine: 'samtts',
        },
      ],
    },
    'electron-pinia-profiles': {
      profiles: [
        {
          id: 'old-profile',
          name: 'Preserved profile',
          shortcut: [],
          openMessengerOnTrigger: true,
          states: {
            'settings.selectedSpeechEngine': 'samtts',
            'settings.enableTranslation': false,
          },
        },
      ],
    },
  }
  fs.mkdirSync(profile, { recursive: true })
  if (phase === 'legacy')
    fs.writeFileSync(
      path.join(profile, 'electron-pinia.json'),
      JSON.stringify(stores),
    )
  else {
    const target = path.join(profile, 'electron-pinia')
    fs.mkdirSync(target)
    for (const [name, value] of Object.entries(stores))
      fs.writeFileSync(
        path.join(target, name + '.json'),
        JSON.stringify({ [name]: value }),
      )
    if (phase === 'damaged')
      fs.writeFileSync(
        path.join(target, 'electron-pinia-settings.json'),
        '{"interrupted":',
      )
  }
  return profile
}
async function checkProfile({
  phase,
  check,
  read,
  evaluate,
  messenger,
  worker,
  unhandled,
  profile,
}) {
  const index = ['legacy', 'split', 'damaged'].indexOf(phase)
  await check(profileCases[index], async () => {
    const settings = await read('settings', '$state')
    if (phase !== 'damaged') {
      assert.equal(settings.theme, 'dark')
      assert.equal(settings.selectedSpeechEngine, 'samtts')
      assert.equal(
        settings.universalApiEndpoint,
        phase === 'legacy'
          ? 'https://api.izabela.app'
          : 'https://custom.example.invalid/v2/',
      )
      assert.equal(settings.preferredSavDir, null)
      assert.deepEqual(settings.audioOutputs, [])
      assert.deepEqual(settings.keybindings.toggleMessengerWindow, [])
      assert.ok(
        settings.keybindings.recordAudio.length,
        'Missing shortcut defaults',
      )
    } else {
      assert.equal(settings.enableSTTTS, false)
      const folder = path.join(profile, 'electron-pinia')
      const backups = fs
        .readdirSync(folder)
        .filter((name) =>
          name.startsWith('electron-pinia-settings.json.corrupt-'),
        )
      assert.equal(backups.length, 1)
      assert.equal(
        fs.readFileSync(path.join(folder, backups[0]), 'utf8'),
        '{"interrupted":',
      )
    }
    assert.equal(
      settings.soxPreRecordingChunks,
      3,
      'New setting default not restored',
    )
    assert.deepEqual(await read('dictionary', 'definitions'), [
      ['old', 'preserved replacement'],
    ])
    assert.equal((await read('messages', 'history'))[0].id, 'old-history')
    assert.equal((await read('messages', 'history'))[0].voice.speed, 72)
    assert.equal(
      (await read('messages', 'shortcutMessages'))[0].id,
      'old-phrase',
    )
    assert.equal(
      (await read('profiles', 'profiles'))[0].name,
      'Preserved profile',
    )
    assert.deepEqual(unhandled, [])
    for (const window of [worker, messenger])
      assert.deepEqual(
        await evaluate(window, () => window.__appTest.errors),
        [],
      )
  })
}
module.exports = { profileCases, seedProfile, checkProfile }
