import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { blobToBase64, Deferred } from '@packages/toolbox'
import {
  useMessagesStore,
  usePlayingMessageStore,
} from '@/features/messages/store'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'
import hash from 'object-hash'

type DownloadResponse = Blob | Response

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

  function getEngine() {
    return getEngineById(engineName)
  }

  function getCacheId() {
    const engine = getEngine()
    const useCacheOnEveryRequest = !!engine?.getUseCacheOnEveryRequest()
    return `${useCacheOnEveryRequest ? 'cache' : id}-${hash(payload)}`
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

  async function prepareAudioElements() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        return Promise.map(
          settingsStore.audioOutputs,
          async (deviceLabel: string) => {
            let mediaDevice

            try {
              mediaDevice = await getMediaDeviceByLabel(deviceLabel)
            } catch (error) {
              console.error(error)
              return null
            }
            if (mediaDevice) {
              const audioElement: any = document.createElement('audio')

              try {
                await audioElement.setSinkId(mediaDevice.deviceId)
              } catch (error) {
                console.error(error)
                return null
              }
              return audioElement
            }
            return null
          },
        )
      })
      .then((resolvedAudioElements) => {
        audioElements = resolvedAudioElements
        return audioElements
      })
  }

  async function play() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        if (cancelled) return
        if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
          audio.volume = 0
        }
        audio.play()
        audioElements.forEach((audioEl) => audioEl && audioEl.play())
      })
      .catch(console.error)
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, audioLoaded.promise])
  }

  async function createAudioSrc(res: DownloadResponse): Promise<string> {
    if (!('body' in res)) return URL.createObjectURL(res)
    const clonedResponse = res.clone()

    if (clonedResponse.headers.get('Content-Type') === 'audio/mpeg') {
      const mediaSource = new MediaSource()

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        const reader = clonedResponse.body?.getReader()

        let queue: Uint8Array[] = []
        let processing = false

        async function pump() {
          if (processing || !reader) return
          const { done, value } = await reader.read()
          if (done) {
            if (!sourceBuffer.updating) {
              mediaSource.endOfStream()
            } else {
              sourceBuffer.addEventListener(
                'updateend',
                () => mediaSource.endOfStream(),
                { once: true },
              )
            }
            return
          }
          queue.push(value)
          processQueue()
        }

        function processQueue() {
          if (queue.length > 0 && !sourceBuffer.updating) {
            processing = true
            sourceBuffer.appendBuffer(queue.shift()!)
          }
        }

        sourceBuffer.addEventListener('updateend', () => {
          processing = false
          processQueue()
          if (!processing) pump()
        })

        await pump()
      })

      return URL.createObjectURL(mediaSource)
    }
    return URL.createObjectURL(await clonedResponse.blob())
  }

  async function downloadAudio(): Promise<DownloadResponse> {
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
    const engine = getEngine()
    if (!engine)
      return Promise.reject(
        new Error('Izabela Message: Selected engine was not found'),
      )
    return engine
      .synthesizeSpeech({
        credentials,
        payload,
      })
      .then((res) => {
        audioDownloaded.resolve(true)
        cacheAudio(res)
        return Promise.resolve(res)
      })
  }

  async function cacheAudio(res: DownloadResponse) {
    if (typeof window !== 'undefined') {
      const { ElectronFilesystem } = window

      let base64 = ''
      if (!('body' in res)) {
        base64 = await blobToBase64(res)
      } else {
        const clonedResponse = res.clone()
        base64 = await blobToBase64(await clonedResponse.blob())
      }
      if (base64) {
        ElectronFilesystem.cacheAudio(getCacheId(), base64)
      }
    }
  }

  async function downloadAudioAndBlobify(): Promise<Blob> {
    return downloadAudio().then((res) => {
      if (!('body' in res)) return res
      const clonedResponse = res.clone()
      return clonedResponse.blob()
    })
  }

  async function loadAudio(res: DownloadResponse, audioEls = audioElements) {
    for (const audioElement of audioEls) {
      if (!audioElement) continue
      audioElement.src = await createAudioSrc(res)
      audioElement.load()
    }
    audio.src = await createAudioSrc(res)
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
    audio.addEventListener('progress', () =>
      emitter.emit('progress', getAudioProgress()),
    )
    audio.addEventListener('error', (e) => onError(e))
  }

  function onError(e: ErrorEvent) {
    emitter.emit('error')
    audioDownloaded.reject(e)
    audioLoaded.reject(e)
  }

  function prepare() {
    addEventListeners()

    // Fetch both at the same time for efficiency
    Promise.all([downloadAudio(), prepareAudioElements()])
      .then(([res, audioEls]) => loadAudio(res, audioEls))
      .catch((reason) => onError(reason))
  }

  if (!disableAutoplay) {
    prepare()
  }

  return {
    id,
    isReady,
    play,
    on,
    downloadAudio,
    downloadAudioAndBlobify,
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
