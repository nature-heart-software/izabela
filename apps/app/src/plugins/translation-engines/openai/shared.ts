import type { ChatModel } from 'openai/resources/shared'
import startCase from 'lodash/startCase'
import camelCase from 'lodash/camelCase'

export const ENGINE_ID = 'openai-translation' as const
export const ENGINE_NAME = 'OpenAI' as const
export const defaultModel = 'gpt-5.2'

const name = startCase(camelCase(ENGINE_ID)).replace(/ /g, '')
export const electronModuleName = `Electron${name}`

// SDK ChatModel entries for text translation over Chat Completions.
// Exclude audio/search/Codex variants, Responses-only Pro models, and models
// already shut down as of 2026-10-28: https://developers.openai.com/api/docs/deprecations
export const models: ChatModel[] = [
  'gpt-6-astra',
  'gpt-6.1-sol',
  'gpt-6.1-terra',
  'gpt-6-sol',
  'gpt-6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-5.5',
  'gpt-5.5-2026-04-23',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5.4-mini-2026-03-17',
  'gpt-5.4-nano-2026-03-17',
  'gpt-5.2',
  'gpt-5.2-2025-12-11',
  'gpt-5.1',
  'gpt-5.1-2025-11-13',
  'gpt-5.1-mini',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-2025-08-07',
  'gpt-5-mini-2025-08-07',
  'gpt-5-nano-2025-08-07',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-2025-04-14',
  'gpt-4.1-mini-2025-04-14',
  'gpt-4o',
  'gpt-4o-2024-11-20',
  'gpt-4o-2024-08-06',
  'gpt-4o-mini',
  'gpt-4o-mini-2024-07-18',
]
