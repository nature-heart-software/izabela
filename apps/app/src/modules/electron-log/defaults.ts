import log from 'electron-log'

log.transports.file.level = 'info'
log.transports.file.maxSize = 10 * 1024 * 1024

// Main-process logs already go to the console and file. Broadcasting another
// copy to every renderer races frame disposal during window reload/shutdown.
if (process.type === 'browser') log.transports.ipc.level = false
