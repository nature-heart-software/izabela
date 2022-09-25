import { generateModules } from '@packages/generate-modules'

export const generateModulesPlugin = (
  ...args: Parameters<typeof generateModules>
) => {
  generateModules(...args)
  return {
    name: 'generate-modules',
  }
}
