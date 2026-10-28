/** Native Windows window handle wrapper. Requires the Windows addon at runtime.
 * @example
 * ```ts
 * import { Window } from 'win-control'
 * Window.getByPid(123)?.setForeground()
 * ```
 */
export class Window {
  /** @param hwnd - Numeric HWND converted to a signed 32-bit native handle. */
  constructor(hwnd: number)
  /** @returns The current foreground window, including a zero handle if none exists. */
  static getForeground(): Window
  /** @param pid - Unsigned 32-bit process identifier.
   * @returns The first visible, unowned window for the process, or undefined.
   */
  static getByPid(pid: number): Window | undefined
  /** @param className - Exact native class name.
   * @returns The matching window, or undefined.
   */
  static getByClassName(className: string): Window | undefined
  /** @param title - Exact native title.
   * @returns The matching window, or undefined.
   */
  static getByTitle(title: string): Window | undefined
  /** @returns Whether bringing the window forward succeeded. */
  setForeground(): boolean
  /** @param insertAfter - HWND or HWND ordering constant.
   * @param x - Screen x-coordinate.
   * @param y - Screen y-coordinate.
   * @param cx - Width in pixels.
   * @param cy - Height in pixels.
   * @param flags - Bitwise combination of SWP flags.
   * @returns The native SetWindowPos result.
   */
  setPosition(
    insertAfter: number,
    x: number,
    y: number,
    cx: number,
    cy: number,
    flags: number,
  ): boolean
  /** @param state - Native show-state number.
   * @returns The native ShowWindow result (previous visibility).
   */
  setShowStatus(state: number): boolean
  /** @param dx - Horizontal position delta.
   * @param dy - Vertical position delta.
   * @param dw - Width delta.
   * @param dh - Height delta.
   * @returns The native MoveWindow result.
   */
  moveRelative(dx: number, dy: number, dw: number, dh: number): boolean
  /** @returns The signed 32-bit numeric HWND. */
  getHwnd(): number
  /** @returns Screen-space rectangle edges, not width and height. */
  getDimensions(): { left: number; top: number; right: number; bottom: number }
  /** @returns Native visibility. */
  isVisible(): boolean
  /** @returns Whether the native HWND exists. */
  exists(): boolean
  /** @returns The UTF-16 window title. */
  getTitle(): string
  /** @returns The native class name. */
  getClassName(): string
  /** @returns The owning process identifier. */
  getPid(): number
  /** @returns Window text and process data when process access succeeds. */
  getProcessInfo(): { windowText: string; pid?: number; path?: string }
  /** @param kind - Native ancestor flag.
   * @returns The requested ancestor, or undefined.
   */
  getAncestor(kind: number): Window | undefined
  /** @returns The parent window, or undefined. */
  getParent(): Window | undefined
  /** Minimizes the window using CloseWindow; does not destroy it.
   * @returns The native CloseWindow result.
   */
  close(): boolean
}

/** Frozen native show-state constants.
 * @example
 * ```ts
 * import { Window, WindowStates } from 'win-control'
 * Window.getForeground().setShowStatus(WindowStates.RESTORE)
 * ```
 */
export const WindowStates: Readonly<{
  HIDE: 0
  SHOWNORMAL: 1
  SHOWMINIMIZED: 2
  MAXIMIZE: 3
  SHOWMAXIMIZED: 3
  SHOWNOACTIVATE: 4
  SHOW: 5
  MINIMIZE: 6
  SHOWMINNOACTIVE: 7
  SHOWNA: 8
  RESTORE: 9
  SHOWDEFAULT: 10
  FORCEMINIMIZE: 11
}>
/** Frozen native ancestor selectors.
 * @example
 * ```ts
 * import { Window, AncestorFlags } from 'win-control'
 * Window.getForeground().getAncestor(AncestorFlags.ROOT)
 * ```
 */
export const AncestorFlags: Readonly<{ PARENT: 1; ROOT: 2; ROOTOWNER: 3 }>
/** Frozen native Z-order handles.
 * @example
 * ```ts
 * import { HWND } from 'win-control'
 * const topmost: -1 = HWND.TOPMOST
 * ```
 */
export const HWND: Readonly<{ NOTOPMOST: -2; TOPMOST: -1; TOP: 0; BOTTOM: 1 }>
/** Frozen, combinable native positioning flags.
 * @example
 * ```ts
 * import { SWP } from 'win-control'
 * const flags = SWP.NOMOVE | SWP.NOSIZE
 * ```
 */
export const SWP: Readonly<{
  NOSIZE: 1
  NOMOVE: 2
  NOZORDER: 4
  NOREDRAW: 8
  NOACTIVATE: 16
  DRAWFRAME: 32
  FRAMECHANGED: 32
  SHOWWINDOW: 64
  HIDEWINDOW: 128
  NOCOPYBITS: 256
  NOOWNERZORDER: 512
  NOREPOSITION: 512
  NOSENDCHANGING: 1024
  DEFERERASE: 8192
  ASYNCWINDOWPOS: 16384
}>
