import axios from 'axios'
import { io } from 'socket.io-client'
import { useSettingsStore } from '@/features/settings/store'
import { decrypt } from '@/utils/security'
import { useSpeechStore } from '@/features/speech/store'

export const socket = io(`ws://localhost:${process.env.VUE_APP_SERVER_WS_PORT}`, {})

export const localApi = axios.create({
  baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}/api`,
})
export const remoteApi = axios.create()
export const api = (type?: 'remote' | 'local') => {
  const settingsStore = useSettingsStore()
  const speechStore = useSpeechStore()
  if (type === 'local') return localApi
  if (speechStore.hasUniversalApiCredentials) {
    remoteApi.defaults.baseURL = `${settingsStore.universalApiEndpoint}/api`
    ;(remoteApi.defaults.headers as any)['api-key'] = decrypt(settingsStore.universalApiKey)
    return remoteApi
  }
  return localApi
}
