// @ts-ignore
import {ipcRenderer, ipcMain} from 'electron';
const isRenderer = typeof window !== 'undefined';

class IPCfy {
    registeredClasses = {}
    constructor(){}
    private newClassInRenderer(Class) {
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
        return this.registeredClasses[className];
    }

    private newClassInMain(Class, ...args) {
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

    public new(Class) {
        if (isRenderer) {
            return this.newClassInRenderer(Class);
        }
        return this.newClassInMain(Class);
    }
}

export default new IPCfy();
