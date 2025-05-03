export function createEngineManager<E>() {
  const engines = new Map()

  function registerEngine(id: string, speechEngine: E) {
    console.log(id)
    engines.set(id, speechEngine)
    return speechEngine
  }

  function getEngineById(id: string) {
    return engines.get(id)
  }

  function getEngines() {
    return Array.from(engines.values())
  }

  return {
    registerEngine,
    getEngineById,
    getEngines,
  }
}
