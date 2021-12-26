type Instance = {
  name: string
  window: Electron.BrowserWindow
}
type Instances = {
  [key: string]: Instance
}
class ElectronWindowManager {
  private instances: Instances = {}
  registerInstance(name: string, window: Electron.BrowserWindow): Instance {
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
