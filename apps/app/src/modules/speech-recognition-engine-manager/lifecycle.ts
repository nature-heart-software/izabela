/** Owns a recognition turn until a result, failure, timeout, or engine teardown. */
export function createRecognitionLifecycle(resultTimeout = 60000) {
  const active = new Set<() => void>()
  let stopped = false
  return {
    get stopped() {
      return stopped
    },
    create({
      useRecording,
      onChunk,
      onEnded,
      cleanup,
    }: {
      useRecording: (options: any) => any
      onChunk: (chunk: any) => void
      onEnded?: () => any
      cleanup?: (reason: string) => void
    }) {
      let ended = false
      let complete!: () => void
      const done = new Promise<void>((resolve) => {
        complete = resolve
      })
      let inputEnded = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const recording = useRecording({
        onChunk(chunk: any) {
          if (ended) return
          try {
            onChunk(chunk)
          } catch {
            finish('', 'error')
          }
        },
        onEnded() {
          if (ended || inputEnded) return
          inputEnded = true
          timer = setTimeout(() => finish('', 'timeout'), resultTimeout)
          try {
            Promise.resolve(onEnded?.()).catch(() => finish('', 'error'))
          } catch {
            finish('', 'error')
          }
        },
      })
      const cancel = () => finish('', 'cleanup')
      function finish(text = '', reason = 'complete') {
        if (ended) return
        ended = true
        if (timer !== undefined) clearTimeout(timer)
        active.delete(cancel)
        recording.resolve(typeof text === 'string' ? text : '')
        recording.stopPumping()
        try {
          cleanup?.(reason)
        } finally {
          complete()
        }
      }
      active.add(cancel)
      return {
        finish,
        done,
        get ended() {
          return ended
        },
        start() {
          if (stopped) cancel()
          else recording.startPumping()
        },
      }
    },
    stop() {
      if (stopped) return
      stopped = true
      active.forEach((cancel) => cancel())
      active.clear()
    },
  }
}
