declare module 'vuex-electron'
declare module 'electron-postman'
declare module '@ryanmorr/ready'
declare module 'hark'
// eslint-disable-next-line no-underscore-dangle
declare const __static: string
declare global {
  interface Window {
    inspect: (el: Element) => void
  }
}
