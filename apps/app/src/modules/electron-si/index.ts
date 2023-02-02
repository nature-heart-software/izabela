import { app } from 'electron'
import nodeAbi from 'node-abi'

export const ElectronSI = () => ({
  getInfo: () => Promise.resolve({
    version: app.getVersion(),
    os: process.platform,
    osVersion: process.getSystemVersion(),
    arch: process.arch,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    electronAbi: nodeAbi.getAbi(process.versions.electron, 'electron'),
    chromiumVersion: process.versions.chrome,
  }),
})

export default ElectronSI()
