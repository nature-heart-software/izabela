// @ts-ignore
import {ipcRenderer, ipcMain, contextBridge } from 'electron';
export const isRenderer = typeof window !== 'undefined';

export class Bridger {
    constructor(){
        this.registeredClasses = {};
    }
    newClassInRenderer(Class) {
        const className = Class.prototype.constructor.name
        const functionList = Object.getOwnPropertyNames(
            Class.prototype,
        ).filter(v => v !== 'constructor');
        if (!this.registeredClasses[className]) {
            this.registeredClasses[className] = {};
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
        return this.registeredClasses[className];
    }

    newClassInMain(Class, ...args) {
        const className = Class.prototype.constructor.name
        const instance = new Class(...args);
        const functionList = Object.getOwnPropertyNames(
            Class.prototype,
        ).filter(v => v !== 'constructor');
        for (const functionName of functionList) {
            ipcMain.handle(`${className}-${functionName}`, async (_, ...args) => {
                return await instance[functionName](...args);
            });
        }
        return instance;
    }

    new(Class) {
        if (isRenderer) {
            return () => this.newClassInRenderer(Class);
        }
        return (...args) => this.newClassInMain(Class, ...args);
    }
}

export const bridge = new Bridger();

export default bridge.registeredClasses;
