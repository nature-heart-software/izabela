import * as path from 'path'
import { app, protocol, Protocol, screen } from 'electron'
import minBy from 'lodash/minBy'
import { readFile } from 'fs'
import { URL } from 'url'
import { execSync } from 'child_process'

export const env = import.meta.env.MODE
export const EXTERNALS_DIR = import.meta.env.DEV
    ? path.resolve('./resources')
    : process.resourcesPath

export const PUBLIC_DIR = import.meta.env.DEV
    ? path.resolve('./public')
    : path.resolve(__dirname, '../dist')
export const getTopLeftWindow = () => {
    const displays = screen.getAllDisplays()
    return minBy(displays, (display) => display.bounds.y)
}

export function createProtocol(scheme: string, customProtocol: Protocol) {
    ;(customProtocol || protocol).registerBufferProtocol(
        scheme,
        (request, respond) => {
            let pathName = new URL(request.url).pathname
            pathName = decodeURI(pathName) // Needed in case URL contains spaces

            readFile(path.join(__dirname, '../dist', pathName), (error, data) => {
                if (error) {
                    console.error(
                        `Failed to read ${ pathName } on ${ scheme } protocol`,
                        error,
                    )
                }
                const extension = path.extname(pathName).toLowerCase()
                let mimeType = ''

                if (extension === '.js') {
                    mimeType = 'text/javascript'
                } else if (extension === '.html') {
                    mimeType = 'text/html'
                } else if (extension === '.css') {
                    mimeType = 'text/css'
                } else if (extension === '.svg' || extension === '.svgz') {
                    mimeType = 'image/svg+xml'
                } else if (extension === '.json') {
                    mimeType = 'application/json'
                } else if (extension === '.wasm') {
                    mimeType = 'application/wasm'
                }

                respond({ mimeType, data })
            })
        },
    )
}

export function isRunningAsAdmin(): boolean {
    if (process.platform === 'win32') {
        try {
            execSync('net session', { stdio: 'ignore' })
            return true
        } catch {
            return false
        }
    }
    return process.getuid?.() === 0
}

export const onExit = (callback: () => void) => {
    process.on('message', (data) => {
        if (process.platform === 'win32' && data === 'graceful-exit') {
            callback()
        }
    })
    ;['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
        process.on(signal, () => {
            callback()
        })
    })

    app.on('before-quit', () => {
        callback()
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            callback()
        }
    })
}

export const getLargestMonitorSize = () => {
    const displays = screen.getAllDisplays()
    let width = 0
    let height = 0

    displays.forEach(display => {
        const { size } = display
        if (size.width > width) width = size.width
        if (size.height > height) height = size.height
    })

    return { width, height }
}