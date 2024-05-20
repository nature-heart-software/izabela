import ElectronWindowManager from '@/modules/electron-window-manager'
import { mouse } from '@/modules/node-mouse'
import throttle from 'lodash/throttle'
import { Hitbox } from '@/modules/vue-hitboxes/types'
import { BrowserWindow, screen, shell } from 'electron'
import { useMessengerStore, useMessengerWindowStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { Deferred } from '@packages/toolbox'
import ffi from 'ffi-napi'
import { getNativeWindowHandleInt } from '@/utils/electron-window'

export const ElectronMessengerWindow = () => {
    /* use isFocused as source of truth instead of window.isFocused() as in some instances
     * window.isFocused() returns true when the window is actually blurred, preventing
     * focus again.
     *  */
    let isFocused = false
    // let lastKeypressTime = 0
    // const doubleKeypressDelta = 500
    let registeredWindow: BrowserWindow | null = null
    let hitboxesStore: ReturnType<typeof useHitboxesStore> | undefined
    let settingsStore: ReturnType<typeof useSettingsStore> | undefined
    let messengerStore: ReturnType<typeof useMessengerStore> | undefined
    let messengerWindowStore:
        | ReturnType<typeof useMessengerWindowStore>
        | undefined
    const ready = Deferred<BrowserWindow>()
    const isReady = () => ready.promise
    let foregroundWindow: string | number | null = null

    const kernel32 = new ffi.Library('Kernel32.dll', {
        GetCurrentThreadId: ['int', []],
    })

    const user32 = new ffi.Library('user32', {
        SetForegroundWindow: ['bool', ['long']],
        GetForegroundWindow: ['long', []],
        SetFocus: ['long', ['long']],
        SetActiveWindow: ['long', ['long']],
        AttachThreadInput: ['bool', ['int', 'long', 'bool']],
        ShowWindow: ['bool', ['long', 'int']],
        FindWindowA: ['long', ['string', 'string']],
        GetTopWindow: ['long', ['long']],
        BringWindowToTop: ['bool', ['long']],
        SwitchToThisWindow: ['void', ['long', 'bool']],
        GetWindowThreadProcessId: ['int', ['long', 'int']],
        SetWindowPos: [
            'bool',
            ['long', 'long', 'int', 'int', 'int', 'int', 'uint'],
        ],
    })

    const getWindow = () =>
        registeredWindow ||
        ElectronWindowManager.getInstanceByName('messenger')?.window

    const openDevTools = () =>
        new Promise((resolve) => {
            const instances = ElectronWindowManager.getInstances()
            instances.forEach((instance) => {
                const { window } = instance
                if (
                    window.webContents.devToolsWebContents &&
                    window.webContents.isDevToolsOpened()
                ) {
                    window.webContents.devToolsWebContents.focus()
                } else {
                    window.webContents.openDevTools({ mode: 'undocked' })
                }
            })
            resolve(true)
        })

    const ensureNativeFocus = () => {
        const window = getWindow()
        if (window) {
            const windowNativeHandle = getNativeWindowHandleInt(window)
            user32.SetForegroundWindow(windowNativeHandle)
        }
    }

    const focus = (context: 'mouse' | 'keyboard') =>
        new Promise((resolve, reject) => {
            messengerWindowStore?.$patch({ focusContext: context })
            const window = getWindow()
            if (window) {
                if (!isFocused) {
                    foregroundWindow = user32.GetForegroundWindow()
                    // to prevent shenanigans with some softwares (*coughs* League of Legends *coughs*)
                    // this makes sure to blur first with ffi-napi for safe measures
                    user32.SetForegroundWindow(0)
                    isFocused = true
                    // window.once('show', () => {
                    //   /* The focus needs to be delayed after the show() to actually focus properly... */
                    //   setTimeout(() => {
                    //     isFocused = true
                    //     window.focus() // Fixes issues with Chrome and input elements
                    //     resolve(true)
                    //   }, 250)
                    // })

                    /* order matters */
                    window.setFocusable(true) // Fixes alwaysOnTop going in the background sometimes for some reasons
                    window.setIgnoreMouseEvents(false)
                    window.show() // Fixes focus properly with Hardware Acceleration for some reasons
                    window.focus() // needed for immediate focus in case the window is already shown

                    // In applications like League of Legends, the window doesn't always receive focus
                    // but we can force it manually once we're sure the window is shown 100%.
                    // Only possible with a timeout atm.
                    setTimeout(() => {
                        ensureNativeFocus()
                    }, 100)
                }
            } else {
                reject()
            }
        })

    const blur = (returnFocus = true) =>
        new Promise((resolve, reject) => {
            const window = getWindow()
            if (window) {
                if (isFocused) {
                    const windowNativeHandle = getNativeWindowHandleInt(window)
                    isFocused = false
                    /* order matters */
                    window.blur() // Fixes issues with Chrome and input elements
                    window.setIgnoreMouseEvents(true)
                    window.setFocusable(false) // Fixes alwaysOnTop going in the background sometimes for some reasons
                    if (foregroundWindow) {
                        if (foregroundWindow !== windowNativeHandle && returnFocus) {
                            user32.SetForegroundWindow(foregroundWindow)
                        }
                        foregroundWindow = null
                    }
                }
                resolve(true)
            } else {
                reject()
            }
        })

    const hide = (returnFocus?: boolean) =>
        new Promise((resolve, reject) => {
            const window = getWindow()
            if (window) {
                blur(returnFocus)
                    .then(() => {
                        window.hide()
                        resolve(true)
                    })
                    .catch(reject)
            } else {
                reject()
            }
        })

    const show = () =>
        new Promise((resolve, reject) => {
            const window = getWindow()
            if (window) {
                focus('mouse')
                resolve(true)
            } else {
                reject()
            }
        })

    const onMouseMove = (mouseX = 0, mouseY = 0) => {
        if (!hitboxesStore) return
        const window = getWindow()
        if (window) {
            if (!window.isDestroyed() && window.isVisible()) {
                // const { x: mouseX = 0, y: mouseY = 0 } = event
                const [windowX, windowY] = window.getPosition()
                const { hitboxes } = hitboxesStore
                const isWithinAnyHitboxes = hitboxes.some(({ x, y, w, h }: Hitbox) => {
                    const isWithinXHitbox =
                        mouseX >= windowX+x && mouseX <= windowX+x+w
                    const isWithinYHitbox =
                        mouseY >= windowY+y && mouseY <= windowY+y+h
                    return isWithinXHitbox && isWithinYHitbox
                })
                if (isWithinAnyHitboxes) {
                    focus('mouse')
                } else {
                    blur()
                }
            }
        }
    }

    const toggleWindow = throttle((context: 'mouse' | 'keyboard') => {
        const window = getWindow()
        if (window) {
            if (window.isVisible()) {
                hide()
            } else {
                focus(context)
            }
        }
        return Promise.resolve()
    }, 250)

    const setDisplay = (id?: Electron.Display['id'] | null) => {
        const window = getWindow()
        if (window) {
            const allDisplays = screen.getAllDisplays()
            const primaryDisplay = screen.getPrimaryDisplay()
            const display = allDisplays.find((d) => d.id === id) || primaryDisplay
            window.setBounds(display.bounds)
        }
    }
    const zoomIn = () => {
        const window = getWindow()
        if (!window) return
        window.webContents.zoomLevel += 0.5
    }

    const zoomOut = () => {
        const window = getWindow()
        if (!window) return
        window.webContents.zoomLevel -= 0.5
    }

    const resetZoom = () => {
        const window = getWindow()
        if (!window) return
        window.webContents.zoomLevel = 0
    }

    const addEventListeners = () => {
        const window = getWindow()
        mouse.on('move', throttle(onMouseMove, 150))

        if (window) {
            window.on('show', () => {
                if (!messengerWindowStore) return
                messengerWindowStore.$patch({ isShown: true })
            })
            window.on('hide', () => {
                if (!messengerWindowStore) return
                messengerWindowStore.$patch({ isShown: false })
            })
            window.on('focus', () => {
                if (!messengerWindowStore) return
                messengerWindowStore.$patch({ isFocused: true })
            })
            window.on('blur', () => {
                if (!messengerWindowStore) return
                messengerWindowStore.$patch({ isFocused: false })
            })
            window.on('close', (e) => {
                e.preventDefault()
                hide()
            })
            window.on('minimize', () => {
                hide()
            })
            window.webContents.setWindowOpenHandler(({ url }) => {
                shell.openExternal(url)
                return { action: 'deny' }
            })
        }
    }

    const start = (window: BrowserWindow) => {
        const localSettingsStore = useSettingsStore()
        settingsStore = localSettingsStore
        messengerStore = useMessengerStore()
        messengerWindowStore = useMessengerWindowStore()
        hitboxesStore = useHitboxesStore()
        registeredWindow = window
        settingsStore.$whenReady().then(() => {
            setDisplay(localSettingsStore.display)
        })
        ready.resolve(window)
    }

    isReady().then(() => {
        addEventListeners()
    })

    return {
        openDevTools,
        focus,
        blur,
        show,
        hide,
        toggleWindow,
        start,
        setDisplay,
        isReady,
        ensureNativeFocus,
        zoomIn,
        zoomOut,
        resetZoom,
    }
}

export default ElectronMessengerWindow()
