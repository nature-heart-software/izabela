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
  let finished = false
  const objectUrls = new Set<string>()
  const streamCleanups = new Set<() => void>()
  const endedOutputs = new Set<HTMLAudioElement>()
  const createObjectURL = (source: Blob | MediaSource) => {
    const url = URL.createObjectURL(source)
    objectUrls.add(url)
    return url
  }
  function releaseAudio() {
    streamCleanups.forEach((cleanup) => cleanup())
    streamCleanups.clear()
    ;[audio, ...audioElements].forEach((element) => {
      if (!element) return
      element.pause()
      if (element.src) {
        element.removeAttribute('src')
        element.load()
      }
    })
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
  }
  function onAudioEnded(element: HTMLAudioElement) {
    if (finished) return
    endedOutputs.add(element)
    if (
      ![audio, ...audioElements.filter(Boolean)].every((output) =>
        endedOutputs.has(output!),
      )
    )
      return
    finished = true
    playingMessageStore.$patch({ id: null, isPlaying: false, progress: 0 })
    releaseAudio()
    emitter.emit('ended')
  }
  // Both deferred promises can reject while a prefetched message is still queued.
  audioDownloaded.promise.catch(() => {})
  audioLoaded.promise.catch(() => {})
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

  function on(
    event: IzabelaMessageEvent,
    callback: (...args: any[]) => void,
  ): void {
    emitter.on(event, callback)
  }

  function pause() {
    audio.pause()
    audioElements.forEach((element) => element?.pause())
  }

  function resume() {
    void play().catch(() => {})
  }

  function cancel() {
    if (finished) return
    cancelled = true
    finished = true
    releaseAudio()
    if (playingMessageStore.id === id)
      playingMessageStore.$patch({
        id: null,
        isPlaying: false,
        progress: 0,
      })
    audioDownloaded.resolve(false)
    audioLoaded.resolve(false)
    emitter.emit('ended')
  }

  function togglePlay() {
    if (audio.paused) {
      resume()
    } else {
      pause()
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
              mediaDevice = await getMediaDeviceByLabel(
                deviceLabel,
                'audiooutput',
              )
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
              audioElement.addEventListener('error', onError)
              audioElement.addEventListener('ended', () =>
                onAudioEnded(audioElement),
              )
              return audioElement
            }
            return null
          },
        )
      })
      .then((resolvedAudioElements) => {
        audioElements = resolvedAudioElements
        if (
          !settingsStore.playSpeechOnDefaultPlaybackDevice &&
          !audioElements.some(Boolean)
        )
          throw new Error('No selected audio output device is available')
        return audioElements
      })
  }

  async function play() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        if (finished) return
        if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
          audio.volume = 0
        }
        return Promise.all([
          audio.play(),
          ...audioElements.map((audioEl) => audioEl?.play()),
        ])
      })
      .catch((error) => {
        onError(error)
        throw error
      })
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, audioLoaded.promise])
  }

  async function createAudioSrc(res: DownloadResponse): Promise<string> {
    if (!('body' in res)) return createObjectURL(res)
    const clonedResponse = res.clone()

    if (clonedResponse.headers.get('Content-Type') === 'audio/mpeg') {
      const mediaSource = new MediaSource()

      mediaSource.addEventListener('sourceopen', async () => {
        if (finished) return
        try {
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
          sourceBuffer.addEventListener('error', onError)
          const reader = clonedResponse.body?.getReader()
          streamCleanups.add(() => {
            void reader?.cancel().catch(() => {})
          })

          let queue: Uint8Array[] = []
          let processing = false

          async function pump() {
            if (finished || processing || !reader) return
            const { done, value } = await reader.read()
            if (finished) return
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
            if (finished) return
            try {
              processing = false
              processQueue()
              if (!processing) void pump().catch(onError)
            } catch (error) {
              onError(error)
            }
          })

          await pump()
        } catch (error) {
          onError(error)
        }
      })

      return createObjectURL(mediaSource)
    }
    return createObjectURL(await clonedResponse.blob())
  }

  async function downloadAudio(): Promise<DownloadResponse> {
    if (typeof window !== 'undefined') {
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

    let audioPromise: Promise<DownloadResponse>
    if (engineName === 'external-audio') {
      audioPromise = fetch(payload.url)
    } else {
      const engine = getEngine()
      if (!engine)
        return Promise.reject(
          new Error('Izabela Message: Selected engine was not found'),
        )
      audioPromise = engine.synthesizeSpeech({
        credentials,
        payload,
      })
    }
    return audioPromise.then((res) => {
      try {
        if (res instanceof Response) {
          const data = res.headers.get('data')
          if (data) emitter.emit('response:data', JSON.parse(data))
        }
      } catch (e) {
        console.error(e)
      }
      audioDownloaded.resolve(true)
      cacheAudio(res).catch(console.error)
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
        await ElectronFilesystem.cacheAudio(getCacheId(), base64)
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
    if (cancelled) return
    for (const audioElement of audioEls) {
      if (!audioElement) continue
      const src = await createAudioSrc(res)
      if (cancelled) {
        URL.revokeObjectURL(src)
        return
      }
      audioElement.src = src
      audioElement.load()
    }
    const src = await createAudioSrc(res)
    if (cancelled) {
      URL.revokeObjectURL(src)
      return
    }
    audio.src = src
    audio.load()
  }

  function getAudioProgress() {
    return audio.currentTime / audio.duration || 0
  }

  function addEventListeners() {
    audio.addEventListener('timeupdate', () => {
      if (finished) return
      emitter.emit('timeupdate', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        progress: getAudioProgress(),
      })
      playingMessageStore.$patch({
        progress: getAudioProgress(),
      })
    })
    audio.addEventListener('play', () => {
      if (finished) return
      playingMessageStore.$patch({
        id,
        isPlaying: true,
      })
    })
    audio.addEventListener('pause', () => {
      if (finished) return
      playingMessageStore.$patch({
        id,
        isPlaying: false,
      })
    })
    audio.addEventListener('canplaythrough', () => {
      if (finished) return
      emitter.emit('canplaythrough')
      audioLoaded.resolve(true)
    })
    audio.addEventListener('started', () => emitter.emit('started'))
    audio.addEventListener('ended', () => onAudioEnded(audio))
    audio.addEventListener('error', (e) => onError(e))
  }

  function onError(e: unknown) {
    if (finished) return
    finished = true
    releaseAudio()
    if (playingMessageStore.id === id)
      playingMessageStore.$patch({ id: null, isPlaying: false, progress: 0 })
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
