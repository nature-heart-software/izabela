import { vi, beforeEach, afterEach, expect, it } from 'vitest'
const start = vi.hoisted(() => vi.fn())
vi.mock('../src/server', () => ({ default: { start } }))
const originalArgv = [...process.argv]
beforeEach(() => {
  vi.resetModules()
  start.mockClear()
})
afterEach(() => {
  process.argv = [...originalArgv]
})
it('actual entrypoint exports server without implicit startup', async () => {
  process.argv = ['node', 'main.cjs']
  const { default: server } = await import('../src/main')
  expect(server.start).toBe(start)
  expect(start).not.toHaveBeenCalled()
})
it('actual entrypoint starts once only with exact --start-server CLI flag', async () => {
  process.argv = ['node', 'main.cjs', '--start-server']
  await import('../src/main')
  expect(start).toHaveBeenCalledExactlyOnceWith()
})
it('actual entrypoint does not start for a similar flag or executable argument', async () => {
  process.argv = ['node', '--start-server', '--start-server=false']
  await import('../src/main')
  expect(start).not.toHaveBeenCalled()
})
