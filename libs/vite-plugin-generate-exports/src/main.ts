import generateExports from 'generate-exports'

const generateExportsPlugin = (...arg: Parameters<typeof generateExports>) => {
  const instance = generateExports(...arg)
  return {
    name: 'vite-plugin-generate-exports',
    buildStart() {
      instance.start()
    },
  }
}

export default generateExportsPlugin
