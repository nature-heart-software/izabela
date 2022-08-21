import { Response } from 'express'

export const handleError = (
  res: Response,
  reason: string,
  message: string,
  code: number,
) => {
  console.log('ERROR: ' + reason, message)
  if (process.env.NODE_ENV === 'production' && code === 500) {
    return res.status(500).json({ error: reason })
  }
  return res.status(code || 500).json({ error: message })
}
