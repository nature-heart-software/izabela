import { readFile, open, mkdir, rename, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const cssName = (name) =>
  `--nv-${name
    .replaceAll('/', '-')
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/[^a-z0-9_-]/g, '-')}`

function put(target, path, value) {
  const parts = path.split('/')
  let current = target
  for (const part of parts.slice(0, -1)) {
    if (
      Object.hasOwn(current, part) &&
      (typeof current[part] !== 'object' ||
        current[part] === null ||
        Object.hasOwn(current[part], 'value'))
    )
      throw new Error(`Token path conflict: ${path}`)
    if (!Object.hasOwn(current, part)) current[part] = {}
    current = current[part]
  }
  if (Object.hasOwn(current, parts.at(-1)))
    throw new Error(`Token path collision: ${path}`)
  current[parts.at(-1)] = value
}

/** Compile a complete Figma variable export without changing its token paths. */
export function compileVariables(snapshot, options = {}) {
  const collections = snapshot.collections.filter(
    ({ name }) => name !== 'Figma',
  )
  const semantic = collections.find(({ name }) => name === 'Semantic Tokens')
  if (!semantic) throw new Error('Missing Semantic Tokens collection')
  const variables = new Map(
    snapshot.variables.map((variable) => [variable.id, variable]),
  )
  if (variables.size !== snapshot.variables.length)
    throw new Error('Duplicate variable id')
  const collectionIds = new Set(snapshot.collections.map(({ id }) => id))
  const collectionNames = new Set(snapshot.collections.map(({ name }) => name))
  if (
    collectionIds.size !== snapshot.collections.length ||
    collectionNames.size !== snapshot.collections.length
  )
    throw new Error('Duplicate collection identity')
  const listed = new Set()
  for (const collection of snapshot.collections) {
    if (
      !collection.modes.length ||
      !collection.modes.some(
        ({ modeId }) => modeId === collection.defaultModeId,
      )
    )
      throw new Error(`Missing default mode: ${collection.name}`)
    if (
      new Set(collection.modes.map(({ modeId }) => modeId)).size !==
      collection.modes.length
    )
      throw new Error(`Duplicate collection mode: ${collection.name}`)
    for (const id of collection.variableIds) {
      if (listed.has(id))
        throw new Error(`Duplicate variable inventory id: ${id}`)
      listed.add(id)
      const variable = variables.get(id)
      if (!variable) throw new Error(`Missing variable alias: ${id}`)
      if (variable.variableCollectionId !== collection.id)
        throw new Error(`Wrong variable collection owner: ${id}`)
      for (const { modeId } of collection.modes) {
        const value = variable.valuesByMode[modeId]
        if (value === undefined)
          throw new Error(`Missing variable mode: ${variable.name} / ${modeId}`)
        if (value?.type === 'VARIABLE_ALIAS') {
          const target = variables.get(value.id)
          if (!target) throw new Error(`Missing variable alias: ${value.id}`)
          if (
            collection.name !== 'Figma' &&
            !collections.some(({ id }) => id === target.variableCollectionId)
          )
            throw new Error(
              `Production alias references Figma-only variable: ${value.id}`,
            )
          if (target.resolvedType !== variable.resolvedType)
            throw new Error(
              `Variable alias type mismatch: ${variable.name} -> ${target.name}`,
            )
          continue
        }
        if (variable.resolvedType === 'COLOR') {
          const channels = [value?.r, value?.g, value?.b, value?.a ?? 1]
          if (
            !channels.every(
              (channel) =>
                typeof channel === 'number' &&
                Number.isFinite(channel) &&
                channel >= 0 &&
                channel <= 1,
            )
          )
            throw new Error(`Invalid color value: ${variable.name}`)
        } else if (
          !(
            variable.resolvedType === 'FLOAT' &&
            typeof value === 'number' &&
            Number.isFinite(value)
          ) &&
          !(variable.resolvedType === 'STRING' && typeof value === 'string') &&
          !(variable.resolvedType === 'BOOLEAN' && typeof value === 'boolean')
        ) {
          throw new Error(
            `Invalid ${variable.resolvedType} scalar: ${variable.name}`,
          )
        }
      }
    }
  }
  if (listed.size !== variables.size)
    throw new Error('Unlisted variables in export inventory')
  const collectionsById = new Map(
    snapshot.collections.map((collection) => [collection.id, collection]),
  )
  function validateAliasPath(id, modes = new Map(), stack = []) {
    if (stack.includes(id))
      throw new Error(`Cyclic variable alias: ${[...stack, id].join(' -> ')}`)
    const variable = variables.get(id)
    const collection = collectionsById.get(variable.variableCollectionId)
    if (!modes.has(collection.id)) {
      // Branch only when an alias reaches a new collection, not over the
      // global Cartesian product. Retain its choice for the entire path:
      // a union of edges from incompatible modes is not a realizable cycle.
      for (const { modeId } of collection.modes)
        validateAliasPath(
          id,
          new Map([...modes, [collection.id, modeId]]),
          stack,
        )
      return
    }
    const value = variable.valuesByMode[modes.get(collection.id)]
    if (value?.type === 'VARIABLE_ALIAS')
      validateAliasPath(value.id, modes, [...stack, id])
  }
  for (const id of variables.keys()) validateAliasPath(id)
  const names = new Set()
  for (const collection of collections) {
    for (const id of collection.variableIds) {
      const variable = variables.get(id)
      if (!variable) throw new Error(`Missing variable alias: ${id}`)
      if (
        variable.name
          .split('/')
          .some(
            (part) =>
              !part || ['__proto__', 'prototype', 'constructor'].includes(part),
          )
      )
        throw new Error(`Unsafe token path: ${variable.name}`)
      const key = cssName(variable.name)
      if (names.has(key))
        throw new Error(`CSS token collision: ${variable.name}`)
      names.add(key)
    }
  }
  const modeIds = new Set()
  const semanticTokens = { colors: {} }
  for (const id of semantic.variableIds) {
    const variable = variables.get(id)
    if (variable.resolvedType === 'COLOR')
      put(semanticTokens.colors, variable.name, {
        value: `var(${cssName(variable.name)})`,
      })
  }
  function resolveValue(id, modes, stack = []) {
    if (stack.includes(id))
      throw new Error(`Cyclic variable alias: ${[...stack, id].join(' -> ')}`)
    const variable = variables.get(id)
    if (!variable) throw new Error(`Missing variable alias: ${id}`)
    if (!Object.hasOwn(modes, variable.variableCollectionId))
      throw new Error(`Production alias references Figma-only variable: ${id}`)
    const value = variable.valuesByMode[modes[variable.variableCollectionId]]
    if (value === undefined)
      throw new Error(
        `Missing variable mode: ${variable.name} / ${
          modes[variable.variableCollectionId]
        }`,
      )
    if (value?.type === 'VARIABLE_ALIAS')
      return resolveValue(value.id, modes, [...stack, id])
    if (variable.resolvedType === 'COLOR') {
      const rgb = [value.r, value.g, value.b].map((channel) =>
        Math.round(channel * 255),
      )
      return value.a === 1 || value.a === undefined
        ? '#' +
            rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')
        : `rgba(${rgb.join(', ')}, ${value.a})`
    }
    return value
  }
  const defaults = Object.fromEntries(
    collections.map(({ id, defaultModeId }) => [id, defaultModeId]),
  )
  const themes = semantic.modes.map((mode) => {
    const themeId = mode.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    if (!themeId || modeIds.has(themeId))
      throw new Error(`Mode id collision: ${mode.name}`)
    modeIds.add(themeId)
    const modes = Object.fromEntries(
      collections.map((collection) => {
        const explicit = options.collectionModes?.[mode.name]?.[collection.name]
        const matching = collection.modes.find((candidate) =>
          explicit
            ? candidate.name === explicit
            : candidate.name === mode.name ||
              mode.name.endsWith(` ${candidate.name}`),
        )
        if (explicit && !matching)
          throw new Error(`Unknown mode ${explicit} for ${collection.name}`)
        return [
          collection.id,
          collection.id === semantic.id
            ? mode.modeId
            : matching?.modeId ?? collection.defaultModeId,
        ]
      }),
    )

    const values = {}
    for (const collection of collections)
      for (const id of collection.variableIds)
        put(values, variables.get(id).name, resolveValue(id, modes))
    return { id: themeId, label: mode.name, values }
  })
  const primitives = {}
  const primitiveCollection = collections.find(({ name }) => name === 'Tokens')
  for (const id of primitiveCollection?.variableIds ?? []) {
    const variable = variables.get(id)
    put(primitives, variable.name, resolveValue(id, defaults))
  }
  const paletteTokens = { colors: {} }
  for (const collection of collections.filter(({ id }) => id !== semantic.id)) {
    for (const id of collection.variableIds) {
      const variable = variables.get(id)
      if (variable.resolvedType === 'COLOR')
        put(paletteTokens.colors, variable.name, {
          value: `var(${cssName(variable.name)})`,
        })
    }
  }
  if (primitives.shadow) {
    semanticTokens.shadows = {}
    const { offsetY, blur, spread } = primitives.shadow
    for (const id of semantic.variableIds) {
      const variable = variables.get(id)
      if (/\/(shadow|shadow-color)$/.test(variable.name))
        put(semanticTokens.shadows, variable.name, {
          value: `0 ${offsetY}px ${blur}px ${spread}px {colors.${variable.name.replaceAll(
            '/',
            '.',
          )}}`,
        })
    }
  }
  return {
    defaultThemeId:
      themes[
        semantic.modes.findIndex(
          ({ modeId }) => modeId === semantic.defaultModeId,
        )
      ].id,
    themes,
    semanticTokens,
    primitives,
    paletteTokens,
  }
}

/** Normalize the plugin export or the local-variables REST response. */
export function normalizeSnapshot(input) {
  const source = input.meta
    ? {
        collections: Object.values(input.meta.variableCollections),
        variables: Object.values(input.meta.variables),
      }
    : input
  const collections = source.collections
    .filter(({ name }) => name !== 'Figma')
    .map(({ id, name, defaultModeId, modes, variableIds }) => ({
      id,
      name,
      defaultModeId,
      modes,
      variableIds,
    }))
  const excluded = new Set(
    source.collections
      .filter(({ name }) => name === 'Figma')
      .map(({ id }) => id),
  )
  const variables = source.variables
    .filter(({ variableCollectionId }) => !excluded.has(variableCollectionId))
    .map(({ id, name, variableCollectionId, resolvedType, valuesByMode }) => ({
      id,
      name,
      variableCollectionId,
      resolvedType,
      valuesByMode,
    }))
  return {
    collections,
    variables,
    ...(input.collectionModes
      ? { collectionModes: input.collectionModes }
      : {}),
  }
}

async function main(args) {
  const check = args.includes('--check')
  const positional = args.filter((arg) => arg !== '--check')
  if (positional.length > 1 || positional.some((arg) => arg.startsWith('--')))
    throw new Error('Usage: figma-import.mjs [variables.json] [--check]')
  const root = fileURLToPath(new URL('../', import.meta.url))
  const snapshotPath = resolve(root, 'figma/variables.json')
  const inputPath = positional[0] ? resolve(positional[0]) : snapshotPath
  const snapshot = normalizeSnapshot(
    JSON.parse(await readFile(inputPath, 'utf8')),
  )
  const generated = compileVariables(snapshot, snapshot)
  const primitivesSource = `/**\n * Primitive values and names authored in the shared variable collections.\n * @example\n * \`\`\`ts\n * const cornerRadius = tokens.radius.md\n * \`\`\`\n */\nexport const tokens = ${JSON.stringify(
    generated.primitives,
    null,
    2,
  ).replace(/\"(\d+)\":/g, '$1:')} as const\n`
  const outputs = new Map([
    [snapshotPath, JSON.stringify(snapshot, null, 2) + '\n'],
    [resolve(root, 'src/primitives.generated.ts'), primitivesSource],
    [
      resolve(root, 'src/figma.generated.json'),
      JSON.stringify(generated, null, 2) + '\n',
    ],
  ])
  if (check) {
    for (const [path, expected] of outputs) {
      const actual = await readFile(path, 'utf8').catch((error) => {
        if (error.code === 'ENOENT') return ''
        throw error
      })
      if (actual !== expected) throw new Error(`Token import is stale: ${path}`)
    }
  } else {
    const pending = new Set()
    const previous = new Map()
    const replaced = []
    async function stage(path, content) {
      const handle = await open(path, 'wx')
      pending.add(path)
      try {
        await handle.writeFile(content)
      } finally {
        await handle.close()
      }
    }
    try {
      for (const [path, content] of outputs) {
        await mkdir(dirname(path), { recursive: true })
        const before = await readFile(path).catch((error) => {
          if (error.code === 'ENOENT') return null
          throw error
        })
        const backup =
          before === null ? null : `${path}.${process.pid}.previous`
        if (backup !== null) await stage(backup, before)
        previous.set(path, backup)
        await stage(`${path}.${process.pid}.pending`, content)
      }
      for (const path of outputs.keys()) {
        await rename(`${path}.${process.pid}.pending`, path)
        replaced.push(path)
      }
    } catch (error) {
      const rollbackErrors = []
      for (const path of replaced.reverse()) {
        const backup = previous.get(path)
        try {
          if (backup === null) await rm(path)
          else await rename(backup, path)
        } catch (rollbackError) {
          // Retain the old bytes for recovery if rollback itself cannot write.
          if (backup !== null) pending.delete(backup)
          rollbackErrors.push(`${path}: ${rollbackError.message}`)
        }
      }
      if (rollbackErrors.length)
        throw new Error(
          `${error.message}; rollback failed: ${rollbackErrors.join('; ')}`,
        )
      throw error
    } finally {
      await Promise.all([...pending].map((path) => rm(path, { force: true })))
    }
  }
  console.log(
    `${check ? 'Verified' : 'Imported'} ${
      snapshot.variables.length
    } variables and ${generated.themes.length} theme modes`,
  )
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
