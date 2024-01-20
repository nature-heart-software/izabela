import si from 'systeminformation'
import sudo from 'sudo-prompt'
import filter from 'lodash/filter'
import path from 'path'
import { EXTERNALS_DIR } from '@/electron/utils'
import { app } from 'electron'
import { Deferred } from '@packages/toolbox'

const VBCResourceExePath = path.join(
  EXTERNALS_DIR,
  process.arch === 'x64' ? '/vbc/VBCABLE_Setup_x64.exe' : '/vbc/VBCABLE_Setup.exe',
)

export const ElectronResources = () => {
  const getSudoOptions = () => ({
    name: app.name,
    // icns: '/Applications/Electron.app/Contents/Resources/Electron.icns', // (optional)
  })
  return {
    isVirtualAudioCableInstalled(): Promise<boolean> {
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        return Promise.resolve(!!vbcDevices.length)
      })
    },
    installVirtualAudioCable(): Promise<boolean> {
      const deferred = Deferred<boolean>()
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        if (!vbcDevices.length) {
          sudo.exec(`${VBCResourceExePath} -i -h`, getSudoOptions(), (error, stdout, stderr) => {
            if (error) return deferred.reject(error)
            deferred.resolve(true)
          })
        }
        return deferred.promise
      })
    },
    uninstallVirtualAudioCable(): Promise<boolean> {
      const deferred = Deferred<boolean>()
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        if (vbcDevices.length) {
          sudo.exec(`${VBCResourceExePath} -u -h`, getSudoOptions(), (error, stdout, stderr) => {
            if (error) return deferred.reject(error)
            deferred.resolve(true)
          })
        }
        return deferred.promise
      })
    },
  }
}

export default ElectronResources()
