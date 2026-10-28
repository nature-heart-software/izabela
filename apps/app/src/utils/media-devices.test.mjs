import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../tests/load-typescript.cjs'

const device = (deviceId, label, kind = 'audioinput') => ({
  deviceId,
  label,
  kind,
})
const inputs = [
  device('camera', 'Camera', 'videoinput'),
  device('default', 'Speakers', 'audiooutput'),
  device('default', 'Default - Microphone A'),
  device('communications', 'Communications - Microphone A'),
  device('a', 'Microphone A'),
  device('b', 'Microphone B'),
  device('speakers', 'Speakers', 'audiooutput'),
]
const api = (enumerateDevices = async () => inputs) =>
  loadTypescript(
    fileURLToPath(new URL('./media-devices.ts', import.meta.url)),
    {},
    { navigator: { mediaDevices: { enumerateDevices } } },
  )

test('SoX choices contain only microphones and remove default/communications duplicates', () => {
  assert.deepEqual(
    Array.from(api().soxMediaInputsFilter(inputs), (d) => d.deviceId),
    ['default', 'b'],
  )
})

test('saved SoX device indexes resolve against the same list used by the selector', async () => {
  assert.equal((await api().getSoxMediaDeviceByIndex(1)).deviceId, 'b')
  assert.equal(await api().getSoxMediaDeviceByIndex(2), null)
})

test('enumeration failure has a null fallback', async () => {
  assert.equal(
    await api(async () => {
      throw new Error('No devices')
    }).getSoxMediaDeviceByIndex(0),
    null,
  )
})

test('output lookup refreshes stale IDs, disappearance, and same-label input/output devices', async () => {
  let devices = [device('old-output', 'Headset', 'audiooutput')]
  const a = api(async () => devices)
  assert.equal(
    (await a.getMediaDeviceByLabel('Headset', 'audiooutput')).deviceId,
    'old-output',
  )
  devices = [
    device('new-output', 'Headset', 'audiooutput'),
    device('mic', 'Headset', 'audioinput'),
  ]
  assert.equal(
    (await a.getMediaDeviceByLabel('Headset', 'audiooutput')).deviceId,
    'new-output',
  )
  devices = []
  assert.equal(await a.getMediaDeviceByLabel('Headset', 'audiooutput'), null)
  devices = [device('returned', 'Headset', 'audiooutput')]
  assert.equal(
    (await a.getMediaDeviceByLabel('Headset', 'audiooutput')).deviceId,
    'returned',
  )
})
