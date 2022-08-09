import generateModules from 'generate-modules'

const generateModulesPlugin = (...arg: Parameters<typeof generateModules>) => {
  generateModules(...arg)
  return {
    name: 'vite-plugin-generate-exports',
    buildStart() {
      // instance.start()
    },
  }
}

export default generateModulesPlugin
