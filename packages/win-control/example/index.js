const spawn = require('child_process').spawn

const {Window, WindowStates, SWP, AncestorFlags, HWND} = require('../src/js/index');

(async () => {
  const showInfo = w => {
    if (!w) {
      console.log('Window not found')
      return
    }

    console.log('hwnd: ', w.getHwnd())
    console.log('title: ', w.getTitle())
    console.log('isVisible: ', w.isVisible())
    console.log('pid: ', w.getPid())
    console.log('classname: ', w.getClassName())
    console.log('exists: ', w.exists())
    console.log('parent: ', w.getParent())
    console.log('ancestor: ', w.getAncestor(AncestorFlags.ROOTOWNER))
    console.log('dimensions: ', w.getDimensions())
  }

  console.log('------------------------------------------')
  console.log('               Current')
  const current = Window.getForeground()
  showInfo(current)
  console.log('------------------------------------------\n')

  const bat = spawn('notepad.exe', [], {detached: true})
  await new Promise(resolve => { setTimeout(resolve, 2000) })

  console.log('------------------------------------------')
  console.log('              notepad by pid')
  const notepadByPid = Window.getByPid(bat.pid)
  showInfo(notepadByPid)
  console.log('------------------------------------------\n')

  console.log('------------------------------------------')
  console.log('           notepad by class name')
  const notepad = Window.getByClassName('Notepad')
  showInfo(notepad)
  console.log('------------------------------------------\n')

  console.log('------------------------------------------')
  console.log('           Calc by title')
  const calc = Window.getByTitle('Calculadora')
  showInfo(calc)
  console.log('------------------------------------------\n')

  console.log('------------------------------------------')
  console.log('         Not existing by title')
  const notExisting = Window.getByTitle('NotExistingTtitle')
  showInfo(notExisting)
  console.log('------------------------------------------\n')

  console.log('------------------------------------------')
  console.log('         Not existing by class name')
  const notExistingClass = Window.getByClassName('NotExistingClassName')
  showInfo(notExistingClass)
  console.log('------------------------------------------\n')

  console.log('Minimize notepad')
  notepad.setShowStatus(WindowStates.FORCEMINIMIZE)
  await new Promise(resolve => { setTimeout(resolve, 2000) })

  console.log('show notepad maximized')
  notepad.setShowStatus(WindowStates.SHOWMAXIMIZED)
  await new Promise(resolve => { setTimeout(resolve, 2000) })

  console.log('show normal notepad')
  notepad.setShowStatus(WindowStates.SHOWNORMAL)
  await new Promise(resolve => { setTimeout(resolve, 2000) })

  console.log('move notepad to 00')
  notepad.setPosition(HWND.TOP, 0, 0, 200, 200, SWP.SHOWWINDOW)
  await new Promise(resolve => { setTimeout(resolve, 2000) })

  // When function are used incorrectly, exceptions are raised
  try {
    Window.getByClassName()
  } catch (error) {
    console.error(error)
  }
  process.exit(0)
})()
