const { journeyCases: j } = require('./journeys.cjs')
const { providers } = require('./providers.cjs')
const tts = providers
  .filter((p) => p.kind === 'tts')
  .map((p) => 'tts: ' + p.name)
const stt = providers
  .filter((p) => p.kind === 'stt')
  .map((p) => 'stt: ' + p.name)
const translation = providers
  .filter((p) => p.kind === 'translation')
  .map((p) => 'translation: ' + p.name)
// Each entry retains the user's macro ID. A boundary prevents a fixture test
// from being reported as certification of an installer, device, or external app.
const checklist = [
  ['Type and speak', ['tts: Sam', j[9]]],
  ['Speak word by word', [j[0]]],
  [
    'Queue and cancel speech',
    [j[1], 'shortcut: cancel current and cancel queued messages'],
  ],
  ['Recall recent text', [j[2]]],
  ['Message history', [j[3]], 'Translated-text copy remains manual.'],
  [
    'Save spoken audio',
    [j[3]],
    'Save-dialog destination is supplied by the harness; external player and Windows dialog interaction remain manual.',
  ],
  ['Personalize voices', [j[18]]],
  [
    'Local speech',
    ['tts: Sam', 'tts: Animalese', 'tts: Windows voices', j[18]],
  ],
  [
    'Cloud speech credentials',
    tts,
    'Live provider calls use injected dev credentials; provider account setup is separate.',
  ],
  [
    'Universal credentials',
    [j[12]],
    'Controlled universal service verifies authentication/routing; hosted entitlement remains manual.',
  ],
  ['Custom TTS', [j[11]]],
  [
    'Expressive speech',
    [
      'tts: Azure expressive style command',
      'tts: OpenAI instructions and custom command',
    ],
    'Payload and audio completion are checked; subjective prosody remains a listening check.',
  ],
  [
    'Push to record',
    ['stt: push-to-record capture, PCM, indicator, and release', ...stt],
    'Known WAV replaces physical microphone input.',
  ],
  [
    'Automatic recognition',
    ['stt: continuous detection and disabling microphone'],
    'Real Hark with synthetic microphone; cloud recognition is covered separately.',
  ],
  [
    'Recognition providers and languages',
    stt,
    'English fixture per configured provider; other languages and physical mic remain manual.',
  ],
  [
    'Translate typed text',
    [...translation, j[13]],
    'Only configured providers run; unavailable providers are reported as not run.',
  ],
  [
    'Translate microphone speech',
    ['stt: microphone recognition through translation and speech'],
    'Synthetic PCM through live recognition, translation and speech.',
  ],
  [
    'Recognition recovery',
    [j[15]],
    'Native server restart is tested; real device/provider interruption remains manual.',
  ],
  [
    'Default Windows output',
    ['tts: Sam'],
    'Decoded output is analysed and muted; changing the OS default device remains manual.',
  ],
  [
    'Several selected outputs',
    [],
    'Requires physical playback devices and verification at each destination.',
  ],
  [
    'Virtual cable into another app',
    [],
    'Requires driver setup and a receiving application.',
  ],
  [
    'Audio device reconnection',
    [],
    'Requires physical device unplug/reconnect; microphone replacement has separate runtime coverage.',
  ],
  ['Saved phrases', [j[6], 'shortcut: saved message and profile']],
  ['Voice profiles', [j[7], 'shortcut: saved message and profile']],
  ['Dictionary expansion', [j[4]]],
  ['Slash commands', [j[5]]],
  [
    'Messenger focus return',
    [
      j[9],
      'shortcut: native messenger toggle and rebind',
      'shortcut: alternate messenger and overlay',
    ],
  ],
  ['Hide and draft behavior', [j[8]], 'Outside-click hiding remains manual.'],
  [
    'Display and placement',
    [j[19], 'persistence: configuration survives full application relaunch'],
    'Single-display dragging/persistence; mixed DPI and display hotplug remain manual.',
  ],
  [
    'Non-focus overlay',
    ['shortcut: alternate messenger and overlay'],
    'Visibility shortcut only; elevated input blocking/editing remains manual.',
  ],
  [
    'Injected game overlay',
    [],
    'Needs an approved game and injection environment.',
  ],
  [
    'Game display/focus changes',
    [],
    'Needs an approved game, resolution changes and input interception.',
  ],
  [
    'Remap shortcuts',
    [
      'shortcut: native messenger toggle and rebind',
      'shortcut: saved message and profile',
    ],
  ],
  [
    'Launch, tray, restart and exit',
    [j[9], 'persistence: configuration survives full application relaunch'],
    'Close-without-quit and full relaunch are tested; tray clicks, second instance and installed shell integration remain manual.',
  ],
  [
    'Persist configuration',
    [
      'persistence: save restart fixture',
      'persistence: configuration survives full application relaunch',
    ],
    'Fresh profile relaunch; installer upgrade/migration remains manual.',
  ],
  [
    'Startup and administrator mode',
    [],
    'Windows login registration and UAC are machine-state tests.',
  ],
  [
    'Theme, zoom and keyboard navigation',
    [
      j[10],
      j[5],
      j[18],
      'persistence: configuration survives full application relaunch',
    ],
    'Theme rendering after relaunch and keyboard controls are tested; full accessibility audit remains manual.',
  ],
  ['Clear speech cache', [j[17]]],
  [
    'Updater policy',
    [j[20]],
    'No-update build policy only; actual update/replacement installs remain manual.',
  ],
  [
    'Help and diagnostics',
    [j[20], j[10]],
    'Guided tour and runtime info; external links and debugging tools remain manual.',
  ],
  ['External speech/audio', [j[14]]],
  [
    'Integration events',
    [j[1], j[14], 'stt: push-to-record capture, PCM, indicator, and release'],
    'Real lifecycle/timing/recording events; a separate streaming-tool UI remains manual.',
  ],
  [
    'Custom recognition round trip',
    [j[15]],
    'Controlled recognizer consumes exported PCM and returns text via say.',
  ],
  [
    'Service failure recovery',
    [j[16]],
    'Controlled HTTP outages; physical network disconnection remains manual.',
  ],
].map(([name, cases, boundary], index) => ({
  id: 'E2E-' + String(index + 1).padStart(2, '0'),
  name,
  cases,
  boundary: boundary || null,
}))

function checklistReport(results) {
  const byName = new Map(results.map((r) => [r.name, r]))
  return checklist.map((entry) => {
    const cases = entry.cases.map((name) => ({
      name,
      status: !byName.has(name)
        ? 'Not run'
        : byName.get(name).pass
        ? 'Pass'
        : 'Fail',
    }))
    const status = cases.some((r) => r.status === 'Fail')
      ? 'Fail'
      : cases.length === 0
      ? 'Manual'
      : cases.some((r) => r.status === 'Not run')
      ? 'Not fully run'
      : entry.boundary
      ? 'Partial'
      : 'Pass'
    return { ...entry, cases, status }
  })
}
module.exports = { checklist, checklistReport }
