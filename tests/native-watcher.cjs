const { pathToFileURL } = require('node:url')

import(pathToFileURL(process.argv[2]).href)
  .then(async (watcher) => {
    await watcher.subscribe({ creation: true, deletion: true })
    await watcher.closeEventSink()
    console.log('PASS wql-process-monitor: DLL loaded and subscription stopped')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
