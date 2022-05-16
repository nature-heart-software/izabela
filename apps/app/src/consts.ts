import { v4 as uuid } from 'uuid'

// Todo: find a better way to invalidate persisted data in store
export const SESSION_ID = uuid()

export const DEFAULT_LANGUAGE_CODE = 'en-US'
