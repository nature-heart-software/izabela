import watcher = require('..')
import '..'
const childModule: object = watcher
void childModule
// @ts-expect-error The child module is not a polling factory.
watcher()
// @ts-expect-error No public start/stop API is exported.
watcher.start()
// @ts-expect-error Options are internal to the side-effect child.
watcher.stop({ interval: 100 })
