import CryptoJS from 'crypto-js'

export const encrypt = (valueToEncrypt: string = '') => {
  let result = ''
  try {
    result = CryptoJS.AES.encrypt(
      valueToEncrypt,
      import.meta.env.VITE_APP_ENCRYPTION_KEY || '',
    ).toString()
  } catch (e) {
    console.error('Could not encrypt value.', e)
  }
  return result
}

export const decrypt = (valueToDecrypt: string = '') => {
  let result = ''
  try {
    const bytes = CryptoJS.AES.decrypt(
      valueToDecrypt,
      import.meta.env.VITE_APP_ENCRYPTION_KEY || '',
    )
    result = bytes.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    console.error('Could not decrypt value.', e)
  }
  return result
}

export const useEncryption = () => ({
  encrypt,
  decrypt,
})
