import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import SamJs from 'sam-js'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const text2Uint8Array = (text: string) => {
  const buffer = new Uint8Array(text.length)
  text.split('').forEach((e, index) => {
    buffer[index] = e.charCodeAt(0)
  })
  return buffer
}
const Uint32ToUint8Array = (uint32: any) => {
  const result = new Uint8Array(4)
  result[0] = uint32
  // eslint-disable-next-line no-bitwise
  result[1] = uint32 >> 8
  // eslint-disable-next-line no-bitwise
  result[2] = uint32 >> 16
  // eslint-disable-next-line no-bitwise
  result[3] = uint32 >> 24
  return result
}
const Uint16ToUint8Array = (uint16: any) => {
  const result = new Uint8Array(2)
  result[0] = uint16
  // eslint-disable-next-line no-bitwise
  result[1] = uint16 >> 8
  return result
}
const getSelectedVoice = () => {
  const voice = getProperty('selectedVoice')
  return voice.name === 'Custom'
    ? {
        ...voice,
        speed: getProperty('speed'),
        speech: getProperty('speech'),
        throat: getProperty('throat'),
        mouth: getProperty('mouth'),
      }
    : voice
}
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getSelectedVoice,
  getVoiceName,
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice: v }) {
    const voice = v || getSelectedVoice()
    return {
      text: translatedText || text,
      voice,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ payload }) {
    const sam = new SamJs(payload.voice)
    const audioBuffer = sam.buf8(payload.text)
    const realBuffer = new Uint8Array(
      4 + // "RIFF"
        4 + // uint32 filesize
        4 + // "WAVE"
        4 + // "fmt "
        4 + // uint32 fmt length
        2 + // uint16 fmt
        2 + // uint16 channels
        4 + // uint32 sample rate
        4 + // uint32 bytes per second
        2 + // uint16 block align
        2 + // uint16 bits per sample
        4 + // "data"
        4 + // uint32 chunk length
        audioBuffer.length,
    )
    let pos = 0

    const write = (buffer: any) => {
      realBuffer.set(buffer, pos)
      pos += buffer.length
    } // RIFF header

    write(text2Uint8Array('RIFF')) // chunkID

    write(Uint32ToUint8Array(audioBuffer.length + 12 + 16 + 8 - 8)) // ChunkSize

    write(text2Uint8Array('WAVE')) // riffType
    // format chunk

    write(text2Uint8Array('fmt '))
    write(Uint32ToUint8Array(16)) // ChunkSize

    write(Uint16ToUint8Array(1)) // wFormatTag - 1 = PCM

    write(Uint16ToUint8Array(1)) // channels

    write(Uint32ToUint8Array(22050)) // samplerate

    write(Uint32ToUint8Array(22050)) // bytes/second

    write(Uint16ToUint8Array(1)) // blockalign

    write(Uint16ToUint8Array(8)) // bits per sample
    // data chunk

    write(text2Uint8Array('data'))
    write(Uint32ToUint8Array(audioBuffer.length)) // buffer length

    write(audioBuffer)
    const blob = new Blob([realBuffer], {
      type: 'audio/vnd.wave',
    })
    return Promise.resolve(blob)
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
