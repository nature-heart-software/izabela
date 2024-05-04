import CryptoJS from 'crypto-js'

export const encrypt = (valueToEncrypt: string) =>
  CryptoJS.AES.encrypt(valueToEncrypt, import.meta.env.VITE_ENCRYPTION_KEY as string).toString()

export const decrypt = (valueToDecrypt: string) => {
  const bytes = CryptoJS.AES.decrypt(valueToDecrypt, import.meta.env.VITE_ENCRYPTION_KEY || '')
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const useEncryption = () => ({
  encrypt,
  decrypt,
})
