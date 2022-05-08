// @ts-ignore
import { contextBridge, ipcMain, ipcRenderer } from 'electron'

export const isRenderer = typeof window !== 'undefined'

export class Bridger {
  constructor() {
    this.registeredClasses = {}
  }

  newClassInRenderer(className, Class) {
    const functionList = Object.getOwnPropertyNames(Class.prototype).filter(
      (v) => v !== 'constructor',
    )
    if (!this.registeredClasses[className]) {
      this.registeredClasses[className] = {}
    }
    for (const functionName of functionList) {
      if (!this.registeredClasses[className][functionName]) {
        this.registeredClasses[className][functionName] = (...args) => {
          return ipcRenderer.invoke(`${className}-${functionName}`, ...args)
        }
      }
    }
    contextBridge.exposeInMainWorld(className, {
      ...this.registeredClasses[className],
    })
    return this.registeredClasses[className]
  }

  newClassInMain(className, Class, ...args) {
    const instance = new Class(...args)
    const functionList = Object.getOwnPropertyNames(Class.prototype).filter(
      (v) => v !== 'constructor',
    )
    for (const functionName of functionList) {
      ipcMain.handle(`${className}-${functionName}`, async (_, ...args) => {
        return await instance[functionName](...args)
      })
    }
    return instance
  }

  new(className, Class) {
    if (isRenderer) {
      return () => this.newClassInRenderer(className, Class)
    }
    return (...args) => this.newClassInMain(className, Class, ...args)
  }
}

export const bridge = new Bridger()

export default bridge.registeredClasses
