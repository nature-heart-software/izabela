import axios from 'axios'
import { io } from 'socket.io-client'
import { useSettingsStore } from '@/features/settings/store'
import { decrypt } from '@/utils/security'
import { useSpeechStore } from '@/features/speech/store'

export const socket = io(
  `ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`,
  {},
)

const localApiBaseUrl = `http://localhost:${
  import.meta.env.VITE_SERVER_PORT
}/api`

export const localAxiosApi = axios.create({
  baseURL: localApiBaseUrl,
})

export const remoteAxiosApi = axios.create({})

export const api = (type?: 'remote' | 'local') => {
  const settingsStore = useSettingsStore()
  const speechStore = useSpeechStore()
  if (type === 'local') return localAxiosApi
  if (speechStore.hasUniversalApiCredentials) {
    remoteAxiosApi.defaults.baseURL = new URL(
      '/api',
      settingsStore.universalApiEndpoint,
    ).toString()
    remoteAxiosApi.defaults.headers.common.Authorization = `Bearer ${decrypt(
      settingsStore.universalApiKey,
    )}`
    return remoteAxiosApi
  }
  return localAxiosApi
}

function throwIfError(response: Response) {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return response
}

export const fetchApi = (
  type: 'remote' | 'local',
  endpoint: string,
  options: RequestInit = {},
) => {
  const settingsStore = useSettingsStore()
  const speechStore = useSpeechStore()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const newOptions = {
    ...options,
    headers,
  }
  if (type === 'local') {
    return fetch(
      new URL(`/api${endpoint}`, localApiBaseUrl).toString(),
      newOptions,
    ).then(throwIfError)
  }
  if (speechStore.hasUniversalApiCredentials) {
    headers.set(
      'Authorization',
      `Bearer ${decrypt(settingsStore.universalApiKey)}`,
    )
    return fetch(
      new URL(`/api${endpoint}`, settingsStore.universalApiEndpoint).toString(),
      newOptions,
    ).then(throwIfError)
  }
  return fetch(
    new URL(`/api${endpoint}`, localApiBaseUrl).toString(),
    newOptions,
  ).then(throwIfError)
}
