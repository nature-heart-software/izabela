import startCase from 'lodash/startCase'
import camelCase from 'lodash/camelCase'

export const ENGINE_ID = 'amazon-translate-translation' as const
export const ENGINE_NAME = 'Amazon Translate' as const

const name = startCase(camelCase(ENGINE_ID)).replace(/ /g, '');
export const electronModuleName = `Electron${name}`
