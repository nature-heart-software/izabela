import generateExports from '@packages/generate-exports'

const generateExportsPlugin = (...args: Parameters<typeof generateExports>) => {
  const instance = generateExports(...args)
  return {
    name: 'generate-exports',
    buildStart() {
      instance.start()
    },
  }
}

export default generateExportsPlugin
