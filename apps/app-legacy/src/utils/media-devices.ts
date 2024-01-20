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

export const soxMediaInputsFilter = (inputs: MediaDeviceInfo[]) =>
  inputs.filter((d) => {
    const defaultDevice = inputs.find((device) => device.deviceId === 'default')
    return (
      d.deviceId !== 'communications' &&
      (defaultDevice?.label === d.label ? true : !defaultDevice?.label.includes(d.label))
    )
  })

export const getSoxMediaDeviceByIndex = (index: number): Promise<MediaDeviceInfo | null> =>
  new Promise((resolve) => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const filteredDevices = soxMediaInputsFilter(devices)
        const device = filteredDevices[index]
        resolve(device || null)
      })
      .catch(() => resolve(null))
  })
