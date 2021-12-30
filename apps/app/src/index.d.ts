declare module '@izabela/*'
declare module 'vuex-electron'
declare global {
  interface Window {
    inspect: (el: Element) => void
  }
}
