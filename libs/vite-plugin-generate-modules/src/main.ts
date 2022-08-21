import { generateModules } from '@packages/generate-modules'

const generateModulesPlugin = (...args: Parameters<typeof generateModules>) => {
  generateModules(...args)
  return {
    name: 'generate-modules',
  }
}

export default generateModulesPlugin
