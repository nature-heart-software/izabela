import { builtinModules } from 'node:module'
import { LibraryOptions } from 'vite'
import { ModuleFormat } from 'rollup'

const pkg = require('../package.json')

export function getRootExternal(ignore: string[] = []) {
    const omitPackages = (keys: string[]) =>
        keys.filter((key) => !ignore.includes(key))
    const externalPackages = [
        ...builtinModules,
        ...builtinModules.map((name) => `node:${ name }`),
        ...omitPackages(Object.keys(pkg.dependencies || {})),
        ...omitPackages(Object.keys(pkg.peerDependencies || {})),
        ...omitPackages(Object.keys(pkg.devDependencies || {})),
    ]
    return externalPackages.map(
        (packageName) => new RegExp(`^${packageName}(\/.*)?`),
    )
}

const formats: LibraryOptions['formats'] = ['cjs', 'es']

export const getFormats: () => LibraryOptions['formats'] = () => {
    return formats
}

export function getFileName(format: ModuleFormat, entryName: string) {
    return `${ entryName }.${
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
