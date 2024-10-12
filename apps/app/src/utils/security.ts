import CryptoJS from 'crypto-js'

export const encrypt = (valueToEncrypt: string) =>
  CryptoJS.AES.encrypt(
    valueToEncrypt,
    import.meta.env.VITE_APP_ENCRYPTION_KEY as string,
  ).toString()

export const decrypt = (valueToDecrypt: string) => {
  let result = ''
  try {
    const bytes = CryptoJS.AES.decrypt(
      valueToDecrypt,
      import.meta.env.VITE_APP_ENCRYPTION_KEY || '',
    )
    bytes.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    console.warn('Could not decrypt value.')
  }
  return result
}

export const useEncryption = () => ({
  encrypt,
  decrypt,
})
