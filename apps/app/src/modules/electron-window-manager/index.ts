export type Instance = {
  name: string
  window: Electron.BrowserWindow
}
export type Instances = {
  [key: string]: Instance
}

class ElectronWindowManager {
  private instances: Instances = {}

  async registerInstance(
    name: string,
    createWindow: (winName: string) => Promise<Electron.BrowserWindow>,
  ): Promise<Instance> {
    const window = await createWindow(name)
    this.instances[name] = {
      name,
      window,
    }
    return this.instances[name]
  }

  getInstanceByName(name: string): Instance | undefined {
    return this.instances[name]
  }
}

export default new ElectronWindowManager()
