import path from 'path'
import type { Entry, Options } from './types'
import fs from 'fs/promises'
import globby from 'globby'
import chokidar from 'chokidar'

export * from './types'

export const generateExports = (config: {
  watch?: boolean
  entries: Partial<Entry>[]
}) => {
  const eol = '\n'
  const defaultOptions: Entry = {
    exportAll: false,
    exportAllAsAlias: true,
    omitExtension: true,
    omitSemi: false,
    singleQuote: true,
    filename: 'index.js',
    include: [],
    exclude: [],
    directories: [],
  }

  const globalOptions: Entry[] = config.entries.map((option) => ({
    ...defaultOptions,
    ...option,
  }))

  const handleFileChange = (
    filePath: string,
    directory: string,
    options: Required<Options>,
  ) => {
    if (filePath !== path.join(directory, options.filename)) {
      generateIndex(directory, options)
    }
  }

  const fileExists = async (path: string) => {
    return !!(await fs.stat(path).catch(() => false))
  }

  const btfs = (path: string): string => {
    return path.replace(/\\/g, '/')
  }

  const getTemplate = (
    directory: string,
    options: Entry | Options,
    files: string[],
  ) => {
    const {
      omitExtension,
      omitSemi,
      singleQuote,
      exportAll,
      exportAllAsAlias,
    } = options
    const quoteType = singleQuote ? "'" : '"'
    return `/**
 * This file is auto-generated by GenerateExportsWebpackPlugin.
 * Check this file into source control.
 * Do not edit this file.
 */${eol}${files
      .sort((a, b) => a.localeCompare(b))
      .map((filePath) => {
        const { name } = path.parse(filePath)
        const exportRelativePath = btfs(
          btfs(filePath)
            .replace(btfs(directory), '')
            .replace(omitExtension ? /\.[^/.]+$/ : '', ''),
        )
        return `export ${
          exportAll
            ? `*${exportAllAsAlias ? ` as ${name}` : ``}`
            : `{ default as ${name} }`
        } from ${quoteType}${
          exportRelativePath.startsWith('/')
            ? `.${exportRelativePath}`
            : `./${exportRelativePath}`
        }${quoteType}${omitSemi ? '' : ';'}`
      })
      .join(eol)}${eol}/* End of auto-generated content. */${eol}`
  }

  const generateIndex = (
    directory: string,
    options: Required<Entry | Options>,
  ) => {
    if (!path.isAbsolute(directory)) directory = path.resolve(directory)
    const { filename, include, exclude } = options
    const indexPath = btfs(path.join(directory, filename))
    globby(include, {
      cwd: directory,
      ignore: exclude,
    })
      .then((files) => {
        const filteredFiles = files.filter((file) => file !== filename)
        const indexTemplate = getTemplate(directory, options, filteredFiles)
        return fileExists(indexPath)
          .then(async (exists) => {
            if (exists) {
              const fileContent = await fs.readFile(indexPath, 'utf8')
              if (fileContent === indexTemplate)
                return Promise.reject('Contents are identical.')
            }
            return fs.mkdir(path.parse(indexPath).dir, { recursive: true })
          })
          .then(() => fs.writeFile(indexPath, indexTemplate))
      })
      .catch(() => {})
  }
  return {
    name: 'generate-exports',
    start() {
      globalOptions.forEach((option, optionIndex) => {
        option.directories.forEach((directoryConfig) => {
          const directoryConfigIsArray = Array.isArray(directoryConfig)
          let directory = directoryConfigIsArray
            ? directoryConfig[0]
            : directoryConfig
          const options = (
            directoryConfigIsArray
              ? { ...globalOptions[optionIndex], ...(directoryConfig[1] || {}) }
              : globalOptions[optionIndex]
          ) as Required<Entry | Options>
          if (!path.isAbsolute(directory)) directory = path.resolve(directory)
          if (!config.watch) {
            return generateIndex(directory, options)
          }
          const watcher = chokidar.watch(options.include, {
            ignored: /^\./,
            cwd: directory,
          })

          watcher
            .on('add', (filePath) =>
              handleFileChange(filePath, directory, options),
            )
            .on('unlink', (filePath) =>
              handleFileChange(filePath, directory, options),
            )
            .on('ready', () => handleFileChange('', directory, options))
        })
      })
    },
  }
}
