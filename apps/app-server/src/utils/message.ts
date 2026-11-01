import { v4 as uuid } from 'uuid'

export const createMessageReceipt = (text: string) => ({
  text,
  id: uuid(),
  timestamp: new Date().toJSON(),
})
