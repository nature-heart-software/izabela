import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'

export default ({ engine: engineName, payload, credentials }: IzabelaMessagePayload) => {
  const id = uuid()
  const audio = new Audio()
  const emitter = mitt()
  const audioDownloaded = Deferred()
  const audioLoaded = Deferred()

  function on(event: IzabelaMessageEvent, callback: () => void): void {
    emitter.on(event, callback)
  }

  async function play() {
    const settingsStore = useSettingsStore()
    await settingsStore.$whenReady()
    Promise.map(settingsStore.audioOutputs, async (deviceLabel: string) => {
      // TODO: Some optimisation possible here
      const mediaDevice = await getMediaDeviceByLabel(deviceLabel)
      if (mediaDevice) {
        const audioElement: any = document.createElement('audio')
        audioElement.src = audio.src
        await audioElement.setSinkId(mediaDevice.deviceId)
        return audioElement
      }
      return null
    }).then((audioElements: (HTMLAudioElement | null)[]) => {
      if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
        audio.volume = 0
      }
      audio.play()
      audioElements.forEach((audioEl) => audioEl && audioEl.play())
    })
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, audioLoaded.promise])
  }

  function downloadAudio() {
    // TODO: change depending on engine
    const engine = getEngineById(engineName)
    if (!engine)
      return Promise.reject(new Error('Izabela Message: Selected engine was   not found'))
    return engine.synthesizeSpeech({
      credentials,
      payload,
    })
  }

  function loadAudio(blob: Blob) {
    audio.src = URL.createObjectURL(blob)
    audio.load()
  }

  function getAudioProgress() {
    return audio.currentTime / audio.duration
  }

  function addEventListeners() {
    audio.addEventListener('canplaythrough', () => {
      emitter.emit('canplaythrough')
      audioLoaded.resolve(true)
    })
    audio.addEventListener('started', () => emitter.emit('started'))
    audio.addEventListener('ended', () => emitter.emit('ended'))
    audio.addEventListener('progress', () => emitter.emit('progress', getAudioProgress()))
    audio.addEventListener('error', (e) => onError(e))
  }

  function onError(e: ErrorEvent) {
    emitter.emit('error')
    audioDownloaded.reject(e)
    audioLoaded.reject(e)
  }

  addEventListeners()
  downloadAudio()
    .then(({ data }) => {
      audioDownloaded.resolve(true)
      loadAudio(data)
    })
    .catch((reason) => onError(reason))

  return {
    id,
    isReady,
    play,
    on,
  }
}
