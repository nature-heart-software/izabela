import { AxiosResponse } from 'axios'

export function axiosBlobResponseToBlob(response: AxiosResponse<Blob>): Blob {
  return response.data
}

export function axiosStreamResponseToMediaSource(
  response: AxiosResponse<ReadableStream>,
): MediaSource {
  const mediaSource = new MediaSource()

  mediaSource.addEventListener('sourceopen', async () => {
    const contentType = response.headers['content-type']
    const sourceBuffer = mediaSource.addSourceBuffer(contentType)
    const reader = response.data.getReader()
    let queue: Uint8Array[] = []
    let processing = false

    async function pump() {
      if (processing) return
      const { done, value } = await reader.read()
      if (done) {
        if (!sourceBuffer.updating) {
          mediaSource.endOfStream()
        } else {
          sourceBuffer.addEventListener('updateend', () => mediaSource.endOfStream(), { once: true })
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

    pump()
  })

  return mediaSource
}