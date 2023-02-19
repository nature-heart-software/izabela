declare module 'vuex-electron'
declare module 'electron-postman'
declare module '@ryanmorr/ready'
declare module 'sam-js'
declare module 'node-record-lpcm16'
declare module '@globalhive/vuejs-tour'

declare module 'socket.io/*'
declare module '@packages/electron-pinia/*'
// eslint-disable-next-line no-underscore-dangle
declare const __static: string
declare const ROOT_DIR: string
declare global {
  interface Window {
    inspect: (el: Element) => void
  }
}
