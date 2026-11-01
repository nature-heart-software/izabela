import { SpeechCommand } from '@/features/speech/types'

export const getMessageCommand = (message: string) => {
  const command = message.split(' ')[0]
  if (command.startsWith('/')) return command.replace('/', '')
  return null
}

export const removeCommandFromMessage = (message: string) => {
  const command = getMessageCommand(message)
  if (command) return message.replace(`/${command}`, '').trim()
  return message
}

export const getCleanMessage = (message: string, engineCommands: SpeechCommand[]) => {
  const command = getMessageCommand(message)
  if (command && !engineCommands.find((c) => c.value === command))
    return message.replace(`/${command}`, '').trim()
  return message
}
