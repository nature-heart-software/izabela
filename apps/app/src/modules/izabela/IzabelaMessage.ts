import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { blobToBase64, Deferred } from '@packages/toolbox'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import objectHash from 'object-hash'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'

export default (messagePayload: IzabelaMessagePayload) => {
  const {
    id: existingId,
    engine: engineName,
    excludeFromHistory,
    disableAutoplay,
    credentials,
    payload,
  } = messagePayload
  const id = existingId || uuid()
  const audio = new Audio()
  const emitter = mitt()
  const audioDownloaded = Deferred()
  const audioLoaded = Deferred()
  const playingMessageStore = usePlayingMessageStore()
  let audioElements: (HTMLAudioElement | null)[] = []
  let cancelled = false
  if (!excludeFromHistory) {
    const messageStore = useMessagesStore()
    messageStore.$whenReady().then(() => {
      messageStore.addToHistory(id, messagePayload)
    })
  }

  function getCacheId() {
    return `${id}-${objectHash(payload)}`
  }

  function on(event: IzabelaMessageEvent, callback: () => void): void {
    emitter.on(event, callback)
  }

  function pause() {
    audio.pause()
  }

  function resume() {
    audio.play()
  }

  function cancel() {
    cancelled = true
    audio.pause()
    audioElements.forEach((audioEl) => audioEl?.pause())
    playingMessageStore.$patch({
      id: null,
      isPlaying: false,
      progress: 0,
    })
    emitter.emit('ended')
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  async function play() {
    const settingsStore = useSettingsStore()
    await settingsStore.$whenReady()
    Promise.map(settingsStore.audioOutputs, async (deviceLabel: string) => {
      // TODO: Some optimisation possible here
      let mediaDevice

      try {
        mediaDevice = await getMediaDeviceByLabel(deviceLabel)
      } catch (error) {
        console.error(error)
        return null
      }
      if (mediaDevice) {
        const audioElement: any = document.createElement('audio')
        audioElement.src = audio.src

        try {
          await audioElement.setSinkId(mediaDevice.deviceId)
        } catch (error) {
          console.error(error)
          return null
        }
        return audioElement
      }
      return null
    })
      .then((res: typeof audioElements) => {
        if (cancelled) return
        if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
          audio.volume = 0
        }
        audio.play()
        audioElements = res
        audioElements.forEach((audioEl) => audioEl && audioEl.play())
      })
      .catch(console.error)
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, audioLoaded.promise])
  }

  async function downloadAudio() {
    if (typeof window) {
      const { ElectronFilesystem } = window
      const cachedAudio = await ElectronFilesystem.getCachedAudio(getCacheId())
      if (cachedAudio) {
        const res = await fetch(cachedAudio)
        const blob = await res.blob()
        if (blob) {
          audioDownloaded.resolve(true)
          return Promise.resolve(blob)
        }
      }
    }
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
        const blob = 'data' in res ? res.data : res
        cacheAudio(blob)
        return Promise.resolve(blob)
      })
  }

  async function cacheAudio(blob: Blob) {
    if (typeof window) {
      const { ElectronFilesystem } = window
      const base64 = await blobToBase64(blob)
      if (base64) ElectronFilesystem.cacheAudio(getCacheId(), base64)
    }
  }

  function loadAudio(blob: Blob) {
    audio.src = URL.createObjectURL(blob)
    audio.load()
  }

  function getAudioProgress() {
    return audio.currentTime / audio.duration
  }

  function addEventListeners() {
    audio.addEventListener('timeupdate', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        progress: audio.currentTime / audio.duration || 0,
      })
    })
    audio.addEventListener('ended', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id: null,
        isPlaying: false,
        progress: 0,
      })
    })
    audio.addEventListener('play', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id,
        isPlaying: true,
      })
    })
    audio.addEventListener('pause', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id,
        isPlaying: false,
      })
    })
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
    addEventListeners()
    downloadAudio()
      .then((blob) => {
        loadAudio(blob)
      })
      .catch((reason) => onError(reason))
  }

  return {
    id,
    isReady,
    play,
    on,
    downloadAudio,
    pause,
    resume,
    cancel,
    togglePlay,
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
