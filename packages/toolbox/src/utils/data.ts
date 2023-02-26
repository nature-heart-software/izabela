export const blobToBase64 = (blob: Blob): Promise<string> => {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise((resolve) => {
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
  })
}
