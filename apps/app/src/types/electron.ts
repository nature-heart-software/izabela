export const rendererProcesses = ['messenger', 'messenger-game-overlay', 'speech-worker', 'overlay'] as const
export const mainProcess = 'main' as const
export const processes = [mainProcess, ...rendererProcesses] as const
export type RendererProcess = (typeof rendererProcesses)[number]
export type MainProcess = typeof mainProcess
export type Process = (typeof processes)[number]
