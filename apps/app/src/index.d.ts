declare module 'vuex-electron'
declare module 'electron-postman'
declare module '@ryanmorr/ready'
declare module 'hark'

declare module '@packages/electron-pinia/main'
declare module '@packages/electron-pinia/renderer'
declare module '@packages/electron-pinia/preload'
// eslint-disable-next-line no-underscore-dangle
declare const __static: string
declare global {
  interface Window {
    inspect: (el: Element) => void
  }
}
