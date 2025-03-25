import log from 'electron-log'

log.transports.file.level = "info"
log.transports.file.maxSize = 10 * 1024 * 1024