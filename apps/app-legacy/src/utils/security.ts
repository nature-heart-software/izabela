import CryptoJS from 'crypto-js'

export const encrypt = (valueToEncrypt: string) =>
  CryptoJS.AES.encrypt(valueToEncrypt, process.env.VUE_APP_ENCRYPTION_KEY as string).toString()

export const decrypt = (valueToDecrypt: string) => {
  const bytes = CryptoJS.AES.decrypt(valueToDecrypt, process.env.VUE_APP_ENCRYPTION_KEY as string)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const useEncryption = () => ({
  encrypt,
  decrypt,
})
