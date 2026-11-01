import { Window, WindowStates, HWND, SWP, AncestorFlags } from '..'

const window: Window = new Window(-1)
const foreground: Window = Window.getForeground()
const maybe: Window | undefined = Window.getByPid(42)
const byClass: Window | undefined = Window.getByClassName('Editor')
const byTitle: Window | undefined = Window.getByTitle('Exact')
const parent: Window | undefined = window.getParent()
const ancestor: Window | undefined = window.getAncestor(AncestorFlags.ROOTOWNER)
const positioned: boolean = window.setPosition(
  HWND.TOPMOST,
  -10,
  20,
  800,
  600,
  SWP.NOMOVE | SWP.NOSIZE,
)
const moved: boolean = window.moveRelative(-1, 2, -3, 4)
const shown: boolean = window.setShowStatus(WindowStates.RESTORE)
const front: boolean = window.setForeground()
const closed: boolean = window.close()
const handle: number = window.getHwnd()
const pid: number = window.getPid()
const title: string = window.getTitle()
const className: string = window.getClassName()
const visible: boolean = window.isVisible()
const exists: boolean = window.exists()
const bounds: { left: number; top: number; right: number; bottom: number } =
  window.getDimensions()
const info = window.getProcessInfo()
const text: string = info.windowText
const processId: number | undefined = info.pid
const path: string | undefined = info.path
const topmost: -1 = HWND.TOPMOST
const alias: 32 = SWP.FRAMECHANGED
// @ts-expect-error HWND must be a number
new Window('123')
// @ts-expect-error PID must be numeric
Window.getByPid('42')
// @ts-expect-error required class name
Window.getByClassName()
// @ts-expect-error exact title must be a string
Window.getByTitle(42)
// @ts-expect-error no-match is possible
const guaranteed: Window = Window.getByPid(42)
// @ts-expect-error all six positioning arguments are required
window.setPosition(HWND.TOP, 0, 0, 100, 100)
// @ts-expect-error movement deltas must be numeric
window.moveRelative(0, 0, '10', 10)
// @ts-expect-error rectangles expose edges, not dimensions
bounds.width
// @ts-expect-error process access may fail
const requiredPid: number = info.pid
// @ts-expect-error runtime constants are frozen
HWND.TOPMOST = 1
// @ts-expect-error no JavaScript enumeration API is exported
Window.enumerate()
void [
  foreground,
  maybe,
  byClass,
  byTitle,
  parent,
  ancestor,
  positioned,
  moved,
  shown,
  front,
  closed,
  handle,
  pid,
  title,
  className,
  visible,
  exists,
  text,
  processId,
  path,
  topmost,
  alias,
  guaranteed,
  requiredPid,
]
