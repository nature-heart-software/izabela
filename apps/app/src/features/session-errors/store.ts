import { defineStore } from 'pinia'

export type ErrorCategory = 'connection' | 'subscription' | 'other'
export type ErrorOperation =
  | 'speech'
  | 'speech-recognition'
  | 'translation'
  | 'provider'
export interface SessionError {
  id: string
  createdAt: string
  category: ErrorCategory
  operation: ErrorOperation
  provider?: string
}

export const useSessionErrorsStore = defineStore('session-errors', {
  state: () => ({
    entries: [] as SessionError[],
    hasOccurred: false,
    revision: 0,
  }),
  electron: { shared: true, persisted: false },
})
