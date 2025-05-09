import startCase from 'lodash/startCase'
import camelCase from 'lodash/camelCase'

export const ENGINE_ID = 'microsoft-azure-translation' as const
export const ENGINE_NAME = 'Microsoft Azure' as const

const name = startCase(camelCase(ENGINE_ID)).replace(/ /g, '');
export const electronModuleName = `Electron${name}`
