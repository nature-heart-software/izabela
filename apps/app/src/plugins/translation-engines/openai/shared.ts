import startCase from 'lodash/startCase'
import camelCase from 'lodash/camelCase'

export const ENGINE_ID = 'openai-translation' as const
export const ENGINE_NAME = 'OpenAI' as const

const name = startCase(camelCase(ENGINE_ID)).replace(/ /g, '');
export const electronModuleName = `Electron${name}`
