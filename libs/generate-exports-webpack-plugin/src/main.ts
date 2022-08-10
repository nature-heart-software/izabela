import generateExports from 'generate-exports'

class GenerateExportsWebpackPlugin {
  instance: ReturnType<typeof generateExports>

  constructor(...args: Parameters<typeof generateExports>) {
    this.instance = generateExports(...args)
  }

  apply() {
    this.instance.start()
  }
}

module.exports = GenerateExportsWebpackPlugin
