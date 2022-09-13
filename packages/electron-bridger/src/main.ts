// @ts-ignore
import { contextBridge, ipcMain, ipcRenderer } from 'electron'
import { Callback, Plugin } from './types'

export * from './types'
export const isRenderer = typeof window !== 'undefined'

export const Bridge = () => {
    const registeredInstances: Record<string, ReturnType<Callback<any>>> = {}

    const newInstancInRenderer = <C extends Callback<C>>(
        name: string,
        pluginCallback: C,
    ) => {
        const instance = pluginCallback()
        const functionList = Object.entries(instance).filter(
            ([_, value]) => typeof value === 'function',
        )
        if (!registeredInstances[name]) {
            registeredInstances[name] = {}
        }
        for (const [functionName] of functionList) {
            if (!registeredInstances[name][functionName]) {
                registeredInstances[name][functionName] = (...args: any[]) => {
                    return ipcRenderer.invoke(`${ name }-${ functionName }`, ...args)
                }
            }
        }
        contextBridge.exposeInMainWorld(name, {
            ...registeredInstances[name],
        })
        return registeredInstances[name]
    }

    const newInstancInMain = <C extends Callback<C>>(
        name: string,
        pluginCallback: C,
    ) => {
        const instance: ReturnType<Callback<any>> = pluginCallback()
        const functionList = Object.entries(instance).filter(
            ([_, value]) => typeof value === 'function',
        )
        for (const [functionName] of functionList) {
            ipcMain.handle(`${ name }-${ functionName }`, async (_, ...args: any[]) => {
                return await instance[functionName](...args)
            })
        }
        return instance
    }

    const registerPlugin = <C extends Callback<C>>(
        name: string,
        pluginCallback: C,
    ) => {
        if (isRenderer) {
            return newInstancInRenderer(name, pluginCallback)
        }
        return newInstancInMain(name, pluginCallback)
    }
    const register = <P extends Plugin<any>[]>(
        plugins: Plugin<ReturnType<P[number][1]>>[],
    ) => {
        plugins.forEach(([name, pluginCallback]) => {
            registerPlugin(name, pluginCallback)
        })
    }
    return {
        registeredInstances,
        register,
    }
}

export const bridge = Bridge()
