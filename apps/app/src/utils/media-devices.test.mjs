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
