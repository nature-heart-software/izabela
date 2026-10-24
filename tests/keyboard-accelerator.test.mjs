import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(
  new URL(
    '../apps/app/src/modules/electron-keybinding/accelerator.ts',
    import.meta.url,
  ),
  'utf8',
)
const { canRegisterElectronShortcut } = await import(
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
    }).outputText,
  ).toString('base64')}`
)

test('standard accelerators stay with Electron', () => {
  for (const shortcut of [
    'Control+Enter',
    'Alt+Enter',
    'Control+Delete',
    'Control+Backspace',
    'Control+Right',
    'NumLock',
  ]) {
    assert.equal(canRegisterElectronShortcut(shortcut), true, shortcut)
  }
})

test('side-specific modifiers stay with the native key listener', () => {
  for (const modifier of ['Control', 'Shift', 'Alt', 'Meta']) {
    for (const side of ['Left', 'Right']) {
      assert.equal(
        canRegisterElectronShortcut(`Control+${modifier}${side}`),
        false,
      )
    }
  }
})

test('empty and modifier-only shortcuts are not sent to Electron', () => {
  for (const shortcut of ['', 'Control', 'Control+Shift', 'Control+']) {
    assert.equal(canRegisterElectronShortcut(shortcut), false, shortcut)
  }
})
