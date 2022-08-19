#!/usr/bin/env node
import generateExports from '@packages/generate-exports'

generateExports({
  entries: [
    {
      omitExtension: true,
      omitSemi: true,
      filename: 'index.ts',
      include: ['**/*.ts'],
      directories: ['./src/plugins'],
    },
  ],
}).start()
