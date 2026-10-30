export const DEFAULT_LANGUAGE_CODE = 'en-US'
const query = new URLSearchParams(location.search)
export const isGameOverlay = query.has('game-overlay')
export const isExperimentalGameOverlay =
  isGameOverlay && query.has('experimental-game-overlay')
