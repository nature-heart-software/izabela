import { win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isSameFilePath } from './fs-path'

const output = String.raw`C:\Users\runner\AppData\Local\Temp\generate-exports-123\index.js`
const forwardOutput =
  'C:/Users/runner/AppData/Local/Temp/generate-exports-123/index.js'

describe('filesystem path observation matcher', () => {
  it.each([
    ['forward-slash observation', forwardOutput, output, true],
    ['forward-slash expectation', output, forwardOutput, true],
    [
      'mixed separators and dot segments',
      String.raw`C:\Users/runner\AppData/Local\Temp/generate-exports-123/./nested/../index.js`,
      output,
      true,
    ],
    [
      'different directory with the same filename',
      'C:/Users/runner/AppData/Local/Temp/generate-exports-456/index.js',
      output,
      false,
    ],
    ['different filename', forwardOutput + '.bak', output, false],
    ['Buffer observation', Buffer.from(forwardOutput), output, false],
    ['URL observation', new URL('file:///' + forwardOutput), output, false],
  ] as const)(
    'compares %s using the supplied path API',
    (_name, observed, expected, same) => {
      expect(isSameFilePath(observed, expected, win32)).toBe(same)
    },
  )
})
