/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface IWindowsKeyMapping {
  vkey: string
  value: string
  withShift: string
  withAltGr: string
  withShiftAltGr: string
}
export interface IWindowsKeyboardMapping {
  [code: string]: IWindowsKeyMapping
}
export interface ILinuxKeyMapping {
  value: string
  withShift: string
  withAltGr: string
  withShiftAltGr: string
}
export interface ILinuxKeyboardMapping {
  [code: string]: ILinuxKeyMapping
}
export interface IMacKeyMapping {
  value: string
  valueIsDeadKey: boolean
  withShift: string
  withShiftIsDeadKey: boolean
  withAltGr: string
  withAltGrIsDeadKey: boolean
  withShiftAltGr: string
  withShiftAltGrIsDeadKey: boolean
}
export interface IMacKeyboardMapping {
  [code: string]: IMacKeyMapping
}

export type IKeyboardMapping =
  IWindowsKeyboardMapping | ILinuxKeyboardMapping | IMacKeyboardMapping

/**
 * Reads the native key map, or an empty array when native loading or retrieval fails.
 * @returns The platform key mapping or the failure sentinel.
 * @example
 * ```ts
 * const mapping = getKeyMap()
 * if (!Array.isArray(mapping)) console.log(mapping.KeyA.value)
 * ```
 */
export function getKeyMap(): IKeyboardMapping | []

export interface IWindowsKeyboardLayoutInfo {
  name: string
  id: string
  text: string
}

export interface ILinuxKeyboardLayoutInfo {
  model: string
  group: number
  layout: string
  variant: string
  options: string
  rules: string
}

export interface IMacKeyboardLayoutInfo {
  id: string
  localizedName: string
  lang: string
}

export type IKeyboardLayoutInfo =
  IWindowsKeyboardLayoutInfo | ILinuxKeyboardLayoutInfo | IMacKeyboardLayoutInfo

/**
 * Reads the active platform layout, returning null on native errors.
 * @returns The current native layout or null.
 * @example
 * ```ts
 * const layout = getCurrentKeyboardLayout()
 * if (layout) console.log(layout)
 * ```
 */
export function getCurrentKeyboardLayout(): IKeyboardLayoutInfo | null

/**
 * Registers a callback for native layout changes. No unsubscribe handle is exposed.
 * @param callback - Invoked when the native layout changes.
 * @returns Nothing; native listener disposal is owned by the native environment.
 * @example
 * ```ts
 * onDidChangeKeyboardLayout(() => console.log(getCurrentKeyboardLayout()))
 * ```
 */
export function onDidChangeKeyboardLayout(callback: () => void): void

/**
 * Reports native ISO keyboard detection, undefined on unsupported platforms, or false on errors.
 * @returns Native ISO detection result.
 * @example
 * ```ts
 * const iso = isISOKeyboard()
 * ```
 */
export function isISOKeyboard(): boolean | undefined
