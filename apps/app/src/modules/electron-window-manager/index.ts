export type Instance = {
  name: string
  window: Electron.BrowserWindow
}
export type Instances = {
  [key: string]: Instance
}

const ElectronWindowManager = () => {
  const instances: Instances = {}

  async function registerInstance(
    name: string,
    createWindow: (winName: string) => Promise<Electron.BrowserWindow>,
  ): Promise<Instance> {
    const window = await createWindow(name)
    instances[name] = {
      name,
      window,
    }
    return instances[name]
  }

  function getInstanceByName(name: string): Instance | undefined {
    return instances[name]
  }

  function getInstances(): Instance[] {
    return Object.values(instances)
  }

  return {
    getInstances,
    getInstanceByName,
    registerInstance,
  }
}

export default ElectronWindowManager()
