declare module '@izabela/*'
declare module 'vuex-electron'
declare module 'electron-postman'
declare global {
  interface Window {
    inspect: (el: Element) => void
  }
}
