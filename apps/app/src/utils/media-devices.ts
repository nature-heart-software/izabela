const mediaDevices: { [key: MediaDeviceInfo['label']]: MediaDeviceInfo } = {}

export const getMediaDeviceByLabel = (
  label: MediaDeviceInfo['label'],
): Promise<MediaDeviceInfo | null> =>
  new Promise((resolve) => {
    if (mediaDevices[label]) {
      resolve(mediaDevices[label])
    } else {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          devices.forEach((device) => {
            mediaDevices[device.label] = device
          })
          const device = mediaDevices[label]
          resolve(device || null)
        })
        .catch(() => resolve(null))
    }
  })
