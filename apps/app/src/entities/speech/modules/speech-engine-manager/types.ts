import { AxiosResponse } from 'axios'

export type Credentials = { [key: string]: any }
export type Payload = { [key: string]: any }

export interface SpeechEngine {
  id: string
  name: string
  getCredentials: () => Credentials
  getPayload: (text: string) => Payload
  synthesizeSpeech: (context: {
    credentials: Credentials
    payload: Payload
  }) => Promise<AxiosResponse<Blob>>
}
