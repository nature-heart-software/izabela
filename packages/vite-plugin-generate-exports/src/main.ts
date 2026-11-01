import { generateExports } from '@packages/generate-exports'

export const generateExportsPlugin = (
  ...args: Parameters<typeof generateExports>
) => {
  const instance = generateExports(...args)
  return {
    name: 'generate-exports',
    buildStart() {
      instance.start()
    },
  }
}
