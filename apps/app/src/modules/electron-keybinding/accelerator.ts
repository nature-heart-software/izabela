// Electron accelerators cannot distinguish left/right modifier keys. Those
// bindings must stay with the native key listener to preserve their meaning.
export function canRegisterElectronShortcut(accelerator: string): boolean {
  const keys = accelerator.split('+')
  const modifier =
    /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)$/
  return (
    keys.every(
      (key) => key && !/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(key),
    ) && keys.some((key) => !modifier.test(key))
  )
}
