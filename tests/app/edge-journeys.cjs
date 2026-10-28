const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const edgeCases = [
  'shortcut: real modifier chord ignores autorepeat and releases across focus changes',
  'cache: unavailable directory does not prevent speech or lose history',
  'recovery: messenger renderer crash reloads persisted state and accepts text',
  'recovery: speech renderer crash releases capture and resumes speech',
]
async function runEdges(c) {
  const { app } = require('electron')
  const {
    check,
    evaluate,
    patch,
    read,
    until,
    sleep,
    messenger,
    worker,
    events,
    keyEvent,
    captures,
    selectTts,
    audioMessage,
    instrument,
  } = c
  await selectTts('samtts')
  await check(edgeCases[0], async () => {
    const saved = await read('messages', 'shortcutMessages')
    const chord = [
      { code: 'ControlLeft', key: 'ControlLeft', keyCode: 162 },
      { code: 'F22', key: 'F22', keyCode: 133 },
    ]
    try {
      const sample = (await read('messages', 'history')).findLast(
        (message) => message.engine === 'samtts',
      )
      assert.ok(sample, 'Saved phrase needs a real speech payload')
      await patch('messages', {
        shortcutMessages: [
          {
            ...sample,
            id: 'repeat-fixture',
            name: 'Repeat fixture',
            message: 'One shortcut.',
            payload: { ...sample.payload, text: 'One shortcut.' },
            shortcut: chord,
          },
        ],
      })
      await sleep(800)
      const start = events.length
      keyEvent(162, 0, 0, 0)
      keyEvent(133, 0, 0, 0)
      for (let n = 0; n < 15; n++) {
        keyEvent(133, 0, 0, 0)
        await sleep(20)
      }
      await until(
        () => events.slice(start).some((e) => e.name === 'message:end'),
        'modifier shortcut playback',
      )
      assert.equal(
        events.slice(start).filter((e) => e.name === 'message:start').length,
        1,
      )
      messenger.show()
      messenger.focus()
      messenger.hide()
      keyEvent(133, 0, 2, 0)
      keyEvent(162, 0, 2, 0)
      await sleep(150)
      const again = events.length
      keyEvent(162, 0, 0, 0)
      keyEvent(133, 0, 0, 0)
      await until(
        () => events.slice(again).some((e) => e.name === 'message:end'),
        'shortcut rearmed after focus change',
      )
      assert.equal(
        events.slice(again).filter((e) => e.name === 'message:start').length,
        1,
      )
    } finally {
      keyEvent(133, 0, 2, 0)
      keyEvent(162, 0, 2, 0)
      await patch('messages', { shortcutMessages: saved })
      // The scenario deliberately hides the native window. Restore through its
      // controller so later UI tests also have correct focus state.
      await evaluate(messenger, async () => {
        await window.ElectronMessengerWindow.hide(false)
        await window.ElectronMessengerWindow.show()
      })
    }
  })
  await check(edgeCases[1], async () => {
    await evaluate(worker, () => window.ElectronFilesystem.clearCache())
    const directory = path.join(
      app.getPath('temp'),
      require('../../apps/app/package.json').productName,
      'cache',
    )
    // Replace only our isolated test profile's cache with a file: an actual
    // filesystem failure in the main-process bridge, without changing ACLs.
    assert.ok(
      path
        .resolve(directory)
        .startsWith(path.resolve(c.config.directory) + path.sep),
    )
    fs.rmdirSync(directory)
    fs.writeFileSync(directory, 'blocked cache fixture')
    try {
      await audioMessage('Cache is optional.', 'samtts')
      assert.ok(
        (await read('messages', 'history')).some(
          (m) => m.message === 'Cache is optional.',
        ),
      )
    } finally {
      fs.unlinkSync(directory)
      fs.mkdirSync(directory)
    }
    await audioMessage('Cache works again.', 'samtts')
  })
  const crash = async (window) => {
    const contents = window.webContents
    const crashed = new Promise((resolve) =>
      contents.once('render-process-gone', resolve),
    )
    contents.forcefullyCrashRenderer()
    await crashed
    await until(
      () =>
        evaluate(window, () =>
          Boolean(document.querySelector('#app')?.__vue_app__),
        ).catch(() => false),
      'crashed renderer mounted again',
      20000,
    )
    await instrument(window)
  }
  await check(edgeCases[2], async () => {
    await patch('settings', { theme: 'dark' })
    await crash(messenger)
    await evaluate(messenger, async () => {
      await window.ElectronMessengerWindow.hide(false)
      await window.ElectronMessengerWindow.show()
    })
    await until(
      () => messenger.isVisible() && messenger.isFocused(),
      'recovered messenger native focus',
    )
    assert.equal(await read('settings', 'theme'), 'dark')
    await selectTts('samtts')
    await audioMessage('Messenger recovered.', 'samtts')
  })
  await check(edgeCases[3], async () => {
    try {
      await patch('settings', {
        enableSTTTS: true,
        speechRecognitionStrategy: 'ptr',
      })
      await until(
        () => captures.some((c) => !c.closed),
        'capture before renderer crash',
      )
      const before = captures.filter((c) => !c.closed)
      keyEvent(129, 0, 0, 0)
      await sleep(200)
      await crash(worker)
      keyEvent(129, 0, 2, 0)
      await until(
        () => before.every((c) => c.closed),
        'pre-crash recorder released',
      )
      await until(
        () => captures.filter((c) => !c.closed).length === 1,
        'one recorder after reload',
      )
      assert.equal(await read('speechRecognition', 'recording'), false)
      await patch('settings', { enableSTTTS: false })
      await until(
        () => captures.every((c) => c.closed),
        'post-crash microphone cleanup',
      )
      await selectTts('samtts')
      await audioMessage('Speech worker recovered.', 'samtts')
    } finally {
      keyEvent(129, 0, 2, 0)
      await patch('settings', { enableSTTTS: false })
    }
  })
}
module.exports = { edgeCases, runEdges }
