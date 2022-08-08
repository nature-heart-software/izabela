let fsevents
if (process.platform !== 'darwin') {
  fsevents = require('fsevents')
}
return fsevents
