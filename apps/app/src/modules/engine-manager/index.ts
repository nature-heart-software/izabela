export function createEngineManager<E>() {
  const engines = new Map()

  function registerEngine(id: string, speechEngine: E) {
    engines.set(id, speechEngine)
    return speechEngine
  }

  function getEngineById(id: string): E | undefined {
    return engines.get(id)
  }

  function getEngines(): E[] {
    return Array.from(engines.values())
  }

  return {
    registerEngine,
    getEngineById,
    getEngines,
  }
}
