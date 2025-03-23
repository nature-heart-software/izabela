import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { app } from 'electron'
import { exec } from 'child_process'

function restartAsAdmin() {
    if (process.platform === 'win32') {
        const appPath = process.execPath
        console.log(appPath)
        exec(
            `powershell -Command "Start-Process -FilePath '${ appPath.replace(/'/g, "''") }' -Verb RunAs"`,
            (error) => {
                if (!error) {
                    app.quit()
                } else {
                    console.error('Failed to restart as admin:', error)
                }
            },
        )
    } else {
        console.warn('Admin restart is only implemented for Windows.')
    }
}

function isRunningAsAdmin(): boolean {
    if (process.platform === 'win32') {
        try {
            const execSync = require('child_process').execSync
            execSync('net session', { stdio: 'ignore' })
            return true
        } catch {
            return false
        }
    }
    return process.getuid?.() === 0
}

const setLaunchOnStartup = (launchOnStartup: boolean) => {
    console.log('[electron-startup] Launch on startup:', launchOnStartup)
    app.setLoginItemSettings({
        openAtLogin: launchOnStartup,
        path: app.getPath('exe'),
    })
}

export default () =>
    app.whenReady().then(() => {
        const settingsStore = useSettingsStore()

        if (settingsStore.runAsAdmin && !isRunningAsAdmin()) {
            restartAsAdmin()
        }
        setLaunchOnStartup(settingsStore.launchOnStartup)
        watch(
            () => settingsStore.launchOnStartup,
            () => {
                setLaunchOnStartup(settingsStore.launchOnStartup)
            },
        )
    })
