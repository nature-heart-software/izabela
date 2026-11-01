const assert = require('node:assert/strict')
const path = require('node:path')
const { spawn } = require('node:child_process')
const resilienceCases = [
  'routing: selected outputs, default mute, and device reconnection',
  'streaming: truncated audio releases the queue and reader',
  'stress: fifty queued playbacks and cancellation waves release audio resources',
  'stress: repeated native recognition restarts leave one recorder',
  'desktop: suspend and resume restore capture without restoring held recording',
  'desktop: tray callbacks and display recovery',
  'desktop: second instance exits without disturbing the running app',
]
async function runResilience(c) {
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
    socket,
    endpoint,
    config,
    selectTts,
    audioMessage,
    captures,
    trayRecords,
    keyEvent,
  } = c
  const { app, screen, powerMonitor } = require('electron')
  const urls = () => evaluate(worker, () => window.__appTest.objectUrls.size)
  const run = (index, fn) =>
    check(resilienceCases[index], async () => {
      await selectTts('samtts')
      try {
        await fn()
      } finally {
        await patch('settings', {
          enableSTTTS: false,
          audioOutputs: [],
          playSpeechOnDefaultPlaybackDevice: true,
        })
        keyEvent(129, 0, 2, 0)
      }
    })
  await run(0, async () => {
    await evaluate(worker, () => {
      window.__routingFixture = {
        enumerate: navigator.mediaDevices.enumerateDevices,
        sink: HTMLMediaElement.prototype.setSinkId,
        version: 1,
        calls: [],
      }
      navigator.mediaDevices.enumerateDevices = async () => [
        {
          deviceId: 'headset-' + window.__routingFixture.version,
          label: 'Fixture headset',
          kind: 'audiooutput',
        },
        { deviceId: 'cable', label: 'Fixture cable', kind: 'audiooutput' },
      ]
      HTMLMediaElement.prototype.setSinkId = async function (id) {
        window.__routingFixture.calls.push(id)
      }
    })
    try {
      await patch('settings', {
        audioOutputs: ['Fixture headset', 'Fixture cable'],
        playSpeechOnDefaultPlaybackDevice: false,
      })
      await audioMessage('Output routing check.', 'samtts')
      assert.deepEqual(
        await evaluate(worker, () => window.__routingFixture.calls.slice(-2)),
        ['headset-1', 'cable'],
      )
      await evaluate(worker, () => {
        window.__routingFixture.version = 2
      })
      await audioMessage('The headset has reconnected.', 'samtts')
      assert.deepEqual(
        await evaluate(worker, () => window.__routingFixture.calls.slice(-2)),
        ['headset-2', 'cable'],
      )
      await until(
        async () => (await urls()) === 0,
        'routed audio URLs released',
      )
    } finally {
      await evaluate(worker, () => {
        navigator.mediaDevices.enumerateDevices =
          window.__routingFixture.enumerate
        HTMLMediaElement.prototype.setSinkId = window.__routingFixture.sink
        delete window.__routingFixture
      })
    }
  })
  await run(1, async () => {
    const start = events.length
    socket.emit('audio:play', endpoint + '/broken.mp3')
    socket.emit('audio:play', endpoint + '/audio.wav')
    await until(
      () => events.slice(start).some((e) => e.name === 'message:error'),
      'truncated stream error',
    )
    await until(
      () =>
        events.slice(start).filter((e) => e.name === 'message:end').length ===
        2,
      'working audio after truncated stream',
    )
    assert.equal(
      events.slice(start).filter((e) => e.name === 'message:error').length,
      1,
    )
    await until(async () => (await urls()) === 0, 'stream resources released')
  })
  await run(2, async () => {
    let start = events.length
    for (let index = 0; index < 50; index++)
      socket.emit('audio:play', endpoint + '/short.wav')
    await until(
      () =>
        events.slice(start).filter((e) => e.name === 'message:end').length ===
        50,
      'fifty ordered completions',
      45000,
    )
    const recent = events.slice(start)
    assert.equal(recent.filter((e) => e.name === 'message:start').length, 50)
    assert.equal(
      new Set(
        recent.filter((e) => e.name === 'message:end').map((e) => e.payload.id),
      ).size,
      50,
    )
    assert.ok(!recent.some((e) => e.name === 'message:error'))
    await until(
      async () => (await urls()) === 0,
      'completed audio URLs released',
    )
    for (let wave = 0; wave < 10; wave++) {
      start = events.length
      for (let index = 0; index < 20; index++)
        socket.emit('audio:play', endpoint + '/audio.wav')
      await until(
        () => events.slice(start).some((e) => e.name === 'message:start'),
        'cancellation wave starts',
      )
      await c.press(17)
      await until(
        async () => !(await read('playing-message', 'isPlaying')),
        'cancellation wave ends',
      )
    }
    await sleep(400)
    await until(
      async () => (await urls()) === 0,
      'canceled audio URLs released',
    )
  })
  await run(3, async () => {
    await patch('settings', {
      selectedSpeechRecognitionEngine: 'custom-speech-recognition',
      speechRecognitionStrategy: 'ptr',
      enableSTTTS: true,
    })
    await until(
      () => captures.some((capture) => !capture.closed),
      'initial recorder',
    )
    for (let index = 0; index < 20; index++) {
      const before = captures.length
      await evaluate(messenger, () =>
        window.ElectronSpeechWorkerWindow.restartNativeSpeechRecognition(),
      )
      await until(
        () => captures.length > before && captures.at(-1).bytes > 0,
        'replacement recorder PCM',
      )
      await until(
        () => captures.filter((capture) => !capture.closed).length === 1,
        'one active recorder',
      )
    }
    await patch('settings', { enableSTTTS: false })
    await until(
      () => captures.every((capture) => capture.closed),
      'all restarted recorders stopped',
    )
  })
  await run(4, async () => {
    await patch('settings', {
      selectedSpeechRecognitionEngine: 'custom-speech-recognition',
      speechRecognitionStrategy: 'ptr',
      enableSTTTS: true,
    })
    await until(
      () => captures.some((capture) => !capture.closed),
      'pre-suspend recorder',
    )
    await sleep(500)
    keyEvent(129, 0, 0, 0)
    await until(
      async () => await read('speechRecognition', 'recording'),
      'held recording before suspend',
    )
    powerMonitor.emit('suspend')
    await until(
      () => captures.every((capture) => capture.closed),
      'capture released on suspend',
    )
    assert.equal(await read('speechRecognition', 'recording'), false)
    assert.equal(await read('settings', 'enableSTTTS'), true)
    keyEvent(129, 0, 2, 0)
    powerMonitor.emit('resume')
    await until(
      () => captures.some((capture) => !capture.closed && capture.bytes > 0),
      'capture restored on resume',
    )
    assert.equal(await read('speechRecognition', 'recording'), false)
    const start = events.length
    await sleep(500)
    keyEvent(129, 0, 0, 0)
    await until(
      () =>
        events
          .slice(start)
          .some((e) => e.name === 'speech:recording:data:chunk'),
      'record shortcut works after resume',
    )
    keyEvent(129, 0, 2, 0)
  })
  await run(5, async () => {
    const entry = trayRecords.at(-1)
    assert.ok(entry, 'Native tray menu was not installed')
    await evaluate(messenger, () => window.ElectronMessengerWindow.hide())
    await until(
      () => !messenger.isVisible(),
      'messenger hidden before tray callback',
    )
    entry.tray.emit('click')
    await until(() => messenger.isVisible(), 'tray callback shows messenger')
    const settings = entry.menu.items.find(
      (item) => item.label === 'Settings',
    ).submenu
    settings.items.find((item) => item.label === 'Reset Display').click()
    await until(
      async () => (await read('settings', 'display')) === null,
      'tray resets display',
    )
    const originalRelaunch = app.relaunch,
      originalExit = app.exit
    let relaunched = 0,
      exited = 0
    try {
      app.relaunch = () => {
        relaunched++
      }
      app.exit = () => {
        exited++
      }
      entry.menu.items.find((item) => item.label === 'Restart').click()
      assert.equal(relaunched, 1)
      assert.equal(exited, 1)
    } finally {
      app.relaunch = originalRelaunch
      app.exit = originalExit
    }
    messenger.setPosition(99999, 99999)
    screen.emit('display-metrics-changed', {}, screen.getPrimaryDisplay(), [
      'bounds',
      'scaleFactor',
    ])
    await until(() => {
      const bounds = messenger.getBounds()
      return screen
        .getAllDisplays()
        .some(
          (display) =>
            bounds.x < display.bounds.x + display.bounds.width &&
            bounds.x + bounds.width > display.bounds.x &&
            bounds.y < display.bounds.y + display.bounds.height &&
            bounds.y + bounds.height > display.bounds.y,
        )
    }, 'window recovers to a connected display')
  })
  await run(6, async () => {
    const before = require('electron')
      .BrowserWindow.getAllWindows()
      .map((window) => window.id)
      .sort()
    let output = ''
    const child = spawn(
      process.execPath,
      [
        path.join(__dirname, 'second-instance.cjs'),
        app.getPath('userData'),
        config.appRoot,
      ],
      {
        cwd: path.join(c.root, 'apps/app'),
        env: { ...process.env, ELECTRON_ENABLE_LOGGING: '' },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })
    const code = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill()
        reject(Error('Second instance did not exit'))
      }, 10000)
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        resolve(code)
      })
    })
    assert.equal(code, 0)
    assert.match(output, /App is already running/)
    assert.deepEqual(
      require('electron')
        .BrowserWindow.getAllWindows()
        .map((window) => window.id)
        .sort(),
      before,
    )
    await audioMessage('The original instance still works.', 'samtts')
  })
}
module.exports = { resilienceCases, runResilience }
