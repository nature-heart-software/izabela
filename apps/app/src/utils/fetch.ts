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
    const queue: Uint8Array[] = []
    let streamingEnded = false

    function processQueue() {
      if (queue.length > 0 && !sourceBuffer.updating) {
        sourceBuffer.appendBuffer(queue.shift()!)
      } else if (streamingEnded && queue.length === 0 && !sourceBuffer.updating) {
        mediaSource.endOfStream()
      }
    }

    sourceBuffer.addEventListener('updateend', processQueue)

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        streamingEnded = true
        processQueue()
        break
      }

      queue.push(value)
      processQueue()
    }
  })

  return mediaSource
}
