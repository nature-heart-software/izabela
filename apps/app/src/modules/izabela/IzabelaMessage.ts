import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'

export default (messagePayload: IzabelaMessagePayload) => {
  const {
    id: existingId,
    engine: engineName,
    payload,
    credentials,
    excludeFromHistory,
    disableAutoplay,
  } = messagePayload
  const id = existingId || uuid()
  let audio: HTMLAudioElement
  const emitter = mitt()
  const audioDownloaded = Deferred()
  const audioLoaded = Deferred()
  const playingMessageStore = usePlayingMessageStore()
  if (!excludeFromHistory) {
    const messageStore = useMessagesStore()
    messageStore.$whenReady().then(() => {
      messageStore.addToHistory(id, messagePayload)
    })
  }

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

      audio.addEventListener('timeupdate', () => {
        playingMessageStore.$patch({
          progress: audio.currentTime / audio.duration || 0,
        })
      })
      audio.addEventListener('ended', () => {
        playingMessageStore.$patch({
          isPlaying: false,
        })
      })
      playingMessageStore.$patch({
        id,
        isPlaying: true,
      })
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
    if (!engine) return Promise.reject(new Error('Izabela Message: Selected engine was not found'))
    return engine
      .synthesizeSpeech({
        credentials,
        payload,
      })
      .then((res) => {
        audioDownloaded.resolve(true)
        return Promise.resolve(res)
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

  if (!disableAutoplay) {
    audio = new Audio()
    addEventListeners()
    downloadAudio()
      .then(({ data }) => {
        loadAudio(data)
      })
      .catch((reason) => onError(reason))
  }

  return {
    id,
    isReady,
    play,
    on,
    downloadAudio,
    getSocketPayload: () => {
      const { credentials: _, ...rest } = messagePayload
      return {
        ...rest,
        id,
        timestamp: new Date().toISOString(),
      }
    },
  }
}
