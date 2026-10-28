export const getMediaDeviceByLabel = async (
  label: MediaDeviceInfo['label'],
  kind?: MediaDeviceKind,
): Promise<MediaDeviceInfo | null> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return (
      devices.find(
        (device) => device.label === label && (!kind || device.kind === kind),
      ) || null
    )
  } catch {
    return null
  }
}

export const soxMediaInputsFilter = (inputs: MediaDeviceInfo[]) =>
  inputs.filter((d) => {
    const defaultDevice = inputs.find(
      (device) => device.kind === 'audioinput' && device.deviceId === 'default',
    )
    return (
      d.kind === 'audioinput' &&
      d.deviceId !== 'communications' &&
      (defaultDevice?.label === d.label
        ? true
        : !defaultDevice?.label.includes(d.label))
    )
  })

export const getSoxMediaDeviceByIndex = (
  index: number,
): Promise<MediaDeviceInfo | null> =>
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
