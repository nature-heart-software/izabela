import path from 'path'
import { transformSync } from '@babel/core'
import { readFileSync, writeFileSync } from 'fs'
import babelPresetTypescript from '@babel/preset-typescript'
import babelPluginTransformModulesCommonjs from '@babel/plugin-transform-modules-commonjs'
import babelPluginTransformModulesUMD from '@babel/plugin-transform-modules-umd'
import babelPluginTransformModulesAMD from '@babel/plugin-transform-modules-amd'
import babelPluginTransformModulesSystemjs from '@babel/plugin-transform-modules-systemjs'
import minimatch from 'minimatch'
import globby from 'globby'
import { BabelPluginsParams, ModuleType, PluginOptions } from './types'

export * from './types'

export const generateModules = (opts: PluginOptions | PluginOptions[]) => {
  const options: PluginOptions[] = Array.isArray(opts) ? opts : [opts]

  const babelPluginsParams: BabelPluginsParams = {
    module: {
      plugin: null,
      ext: '.mjs',
    },
    commonjs: {
      plugin: babelPluginTransformModulesCommonjs,
      ext: '.cjs',
    },
    umd: {
      plugin: babelPluginTransformModulesUMD,
      ext: '.umd.js',
    },
    amd: {
      plugin: babelPluginTransformModulesAMD,
      ext: '.amd.js',
    },
    systemjs: {
      plugin: babelPluginTransformModulesSystemjs,
      ext: '.system.js',
    },
  }

  // const btfs = (path: string): string => {
  //   return path.replace(/\\/g, '/')
  // }

  const transformFiles = (files: string[]) => {
    files.forEach((file) => {
      const patternOptions = options.find(({ pattern }) =>
        minimatch(file, pattern),
      )
      if (patternOptions) {
        transformModules(file, patternOptions)
      }
    })
  }

  const transformModules = (filepath: string, { into }: PluginOptions) => {
    try {
      const moduleTypes = typeof into === 'string' ? [into] : into
      const { dir, name, base } = path.parse(filepath)
      const fileContent = readFileSync(filepath, { encoding: 'utf8' })
      Object.entries(babelPluginsParams)
        .filter(([type]) => moduleTypes.includes(type as ModuleType))
        .forEach(([_, { plugin, ext }]) => {
          const transformedFileContent = transformSync(fileContent, {
            presets: [babelPresetTypescript],
            plugins: [plugin].filter(Boolean),
            filename: base,
          }).code
          const contentWithComments = `/**
 * This file is auto-generated by GenerateModulesWebpackPlugin.
 * Check this file into source control.
 * Do not edit this file.
 */\n${transformedFileContent}\n/* End of auto-generated content. */\n`
          writeFileSync(path.join(dir, name) + ext, contentWithComments)
        })
    } catch (e: any) {
      console.error(
        `TransformModulesWebpackPlugin: Couldn't transform module (${filepath}) - ${e.message}`,
      )
    }
  }

  // const start = () => {
  //   const { cwd } = process
  //   compiler.hooks.watchRun.tap('WatchRun', (comp) => {
  //     if (comp.modifiedFiles) {
  //       const modifiedFiles: string[] = Array.from(comp.modifiedFiles)
  //       modifiedFiles.forEach((modifiedFile) => {
  //         const patternOptions = options.find(({ pattern }) => {
  //           const target = btfs(path.normalize(modifiedFile))
  //           const resolvedPattern = btfs(path.resolve(cwd(), pattern))
  //           return minimatch(target, resolvedPattern)
  //         })
  //         if (patternOptions) {
  //           this.transformModules(modifiedFile, patternOptions)
  //         }
  //       })
  //     }
  //   })
  // }
  transformFiles(globby.sync(options.map(({ pattern }) => pattern)))
  // return {start}
}

export default generateModules