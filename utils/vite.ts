import { builtinModules } from 'module'

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
