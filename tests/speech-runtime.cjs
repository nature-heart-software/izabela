// Exercise the real listener, Hark analyser, and recording indicator in Electron.
// Audio comes from an oscillator; this test never opens a physical microphone.
const assert = require('node:assert/strict')
const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const electron = require('electron')
const { parse, compileScript } = require('@vue/compiler-sfc')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
if (typeof electron === 'string') {
  const { spawn } = require('node:child_process')
  const directory = mkdtempSync(path.join(tmpdir(), 'izabela-speech-test-'))
  const child = spawn(electron, [__filename], {
    windowsHide: true,
    stdio: 'inherit',
    env: { ...process.env, IZABELA_SPEECH_TEST_DIR: directory },
  })
  child.on('error', (error) => {
    console.error(error)
    process.exitCode = 1
  })
  child.on('close', (code) => {
    // The profile's files remain locked until Electron has actually exited.
    assert.equal(path.dirname(directory), path.resolve(tmpdir()))
    assert.ok(path.basename(directory).startsWith('izabela-speech-test-'))
    rmSync(directory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
    process.exitCode = code === 0 ? 0 : 1
  })
  return
}
const { app, BrowserWindow } = electron
const fixtureDirectory =
  process.env.IZABELA_SPEECH_TEST_DIR ||
  mkdtempSync(path.join(tmpdir(), 'izabela-speech-test-'))
app.setPath('userData', path.join(fixtureDirectory, 'profile'))
app.commandLine.appendSwitch('no-sandbox')
let window

function compile(relative) {
  const filename = path.join(root, relative)
  let source = readFileSync(filename, 'utf8')
  if (!parse(source, { filename }).descriptor.scriptSetup) {
    source += '\n<script setup>const fixture = true</script>'
  }
  const { descriptor } = parse(source, { filename })
  const script = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  })
  return ts.transpileModule(script.content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
}

async function run() {
  await app.whenReady()
  window = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  })
  const html = path.join(fixtureDirectory, 'index.html')
  writeFileSync(html, '<!doctype html><div id="app"></div>')
  await window.loadFile(html)
  const code = {
    listener: compile(
      'apps/app/src/teams/speech-worker/components/NvSpeechListener.vue',
    ),
    logo: compile(
      'apps/app/src/teams/speech-worker/components/NvSpeechRecordingLogo.vue',
    ),
    app: compile('apps/app/src/teams/speech-worker/App.vue'),
  }
  const paths = { vue: require.resolve('vue'), hark: require.resolve('hark') }
  const result = await window.webContents
    .executeJavaScript(`(async (code, paths) => {
    const vue = require(paths.vue)
    const hark = require(paths.hark)
    const settings = vue.reactive({enableSTTTS:true, speechRecognitionStrategy:'continuous', soxDevice:0, audioInputSensibility:-50, speechDetectionPolling:20})
    const recognition = vue.reactive({recording:false, $patch(value) {Object.assign(this,value)}})
    const emitted = []
    const contexts = []
    const streams = []
    const gains = []
    const errors = []
    const virtualNavigator = {mediaDevices:{async getUserMedia() {
      const context = new AudioContext()
      await context.resume()
      const source = context.createOscillator()
      source.frequency.value = 1000
      const gain = context.createGain()
      gain.gain.value = 0
      const destination = context.createMediaStreamDestination()
      source.connect(gain).connect(destination)
      source.start()
      contexts.push(context); streams.push(destination.stream); gains.push(gain)
      return destination.stream
    }}}
    const mocks = {
      vue, hark,
      '@/features/settings/store': {useSettingsStore:()=>settings},
      '@/features/speech/store': {useSpeechRecognitionStore:()=>recognition},
      '@/utils/media-devices': {getSoxMediaDeviceByIndex:async (index)=>({deviceId:'synthetic-'+index})},
      '@/services': {socket:{emit(...args){emitted.push(args)}}},
      '@/teams/speech-worker/components/NvSpeechSynthesizer.vue': {default:{render:()=>null}},
      '@/teams/speech-worker/components/NvAudioInputUpdater.vue': {default:{render:()=>null}},
    }
    function load(source) {
      const module = {exports:{}}
      new Function('require','module','exports','navigator','console',source)(id=>{
        if (!(id in mocks)) throw new Error('Unexpected runtime dependency: '+id)
        return mocks[id]
      },module,module.exports,virtualNavigator,{log(){},error(...args){errors.push(args.map(String).join(' '))}})
      return module.exports.default
    }
    mocks['@/teams/speech-worker/components/NvSpeechListener.vue'] = {__esModule:true,default:load(code.listener)}
    mocks['@/teams/speech-worker/components/NvSpeechRecordingLogo.vue'] = {__esModule:true,default:load(code.logo)}
    const mounted = vue.createApp(load(code.app))
    mounted.mount('#app')
    const waitFor = async (fn, label) => {
      const deadline = Date.now()+6000
      while(!fn()) {
        if (Date.now()>deadline) throw new Error('Timed out: '+label+'; '+errors.join('; '))
        await new Promise(resolve=>setTimeout(resolve,20))
      }
      await vue.nextTick()
    }
    try {
      await waitFor(()=>gains.length===1,'initial capture')
      gains[0].gain.value = 0.25
      await waitFor(()=>recognition.recording,'speech detection')
      const indicatorVisible = !!document.querySelector('.animation-wrapper')
      gains[0].gain.value = 0
      await waitFor(()=>!recognition.recording,'silence detection')
      const indicatorHidden = !document.querySelector('.animation-wrapper')
      settings.soxDevice = 1
      await waitFor(()=>gains.length===2,'microphone change')
      const oldTrackStopped = streams[0].getTracks().every(track=>track.readyState==='ended')
      gains[1].gain.value = 0.25
      await waitFor(()=>recognition.recording,'speech on replacement microphone')
      settings.enableSTTTS = false
      await waitFor(()=>!recognition.recording,'disabled input')
      const allTracksStopped = streams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))
      return {indicatorVisible,indicatorHidden,oldTrackStopped,allTracksStopped,events:emitted.map(args=>args[0]),errors}
    } finally {
      mounted.unmount()
      streams.forEach(stream=>stream.getTracks().forEach(track=>track.stop()))
      await Promise.all(contexts.map(context=>context.close()))
    }
  })(${JSON.stringify(code)},${JSON.stringify(paths)})`)
  assert.deepEqual(result.errors, [])
  for (const key of [
    'indicatorVisible',
    'indicatorHidden',
    'oldTrackStopped',
    'allTracksStopped',
  ]) {
    assert.equal(result[key], true, key)
  }
  assert.deepEqual(result.events, [
    'speech:recording:start',
    'speech:recording:end',
    'speech:recording:start',
    'speech:recording:end',
  ])
  console.log(
    'PASS speech runtime: real Hark audio detection, visible indicator, silence, microphone replacement, and capture cleanup in Electron ' +
      process.versions.electron,
  )
}

const timeout = setTimeout(() => {
  console.error('Speech runtime test timed out')
  app.exit(1)
}, 30000)
run()
  .then(() => {
    clearTimeout(timeout)
    window?.destroy()
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
