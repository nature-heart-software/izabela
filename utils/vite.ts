import { builtinModules } from 'node:module'
import { LibraryOptions } from 'vite'
import { ModuleFormat } from 'rollup'

const pkg = require('../package.json')

const omitPackages = (keys: string[], ignore: string[] = []) =>
  keys.filter((key) => !ignore.includes(key))

export function getRootExternal(ignore: string[] = []) {
  const externalPackages = [
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`),
    ...omitPackages(Object.keys(pkg.dependencies || {}), ignore),
    ...omitPackages(Object.keys(pkg.peerDependencies || {}), ignore),
    ...omitPackages(Object.keys(pkg.devDependencies || {}), ignore),
  ]
  return [
    ...getNodeExternal(),
    ...externalPackages.map(
      (packageName) => new RegExp(`^${packageName}(\/.*)?`),
    ),
  ]
}

export function getNodeExternal() {
  return [...builtinModules, ...builtinModules.map((name) => `node:${name}`)]
}

const formats: LibraryOptions['formats'] = ['cjs', 'es']

export const getFormats: () => LibraryOptions['formats'] = () => {
  return formats
}

export function getFileName(format: ModuleFormat, entryName: string) {
  return `${entryName}.${
    {
      cjs: 'cjs',
      es: 'js',
      amd: '',
      commonjs: '',
      esm: '',
      iife: '',
      systemjs: '',
      system: '',
      umd: '',
      module: '',
    }[format]
  }`
}
