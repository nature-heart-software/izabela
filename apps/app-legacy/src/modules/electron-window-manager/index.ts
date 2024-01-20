export type ElectronWindowManagerInstance = {
  name: string
  window: Electron.BrowserWindow
}
export type Instances = {
  [key: string]: ElectronWindowManagerInstance
}

const ElectronWindowManager = () => {
  const instances: Instances = {}

  async function registerInstance(
    name: string,
    createWindow: (winName: string) => Promise<Electron.BrowserWindow>,
  ): Promise<ElectronWindowManagerInstance> {
    const window = await createWindow(name)
    instances[name] = {
      name,
      window,
    }
    return instances[name]
  }

  function getInstanceByName(name: string): ElectronWindowManagerInstance | undefined {
    return instances[name]
  }

  function getInstances(): ElectronWindowManagerInstance[] {
    return Object.values(instances)
  }

  return {
    getInstances,
    getInstanceByName,
    registerInstance,
  }
}

export default ElectronWindowManager()
