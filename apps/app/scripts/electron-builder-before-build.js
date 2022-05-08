const path = require('path')
const fs = require('fs')
const replace = require('replace')

exports.default = async (context) => {
  const workDir = path.join(context.appDir, 'css')
  const files = fs.readdirSync(workDir)
  replace({
    regex: 'app:///fonts',
    replacement: 'app://./fonts',
    paths: files.map((val) => path.join(workDir, val)),
    recursive: false,
    silent: false,
  })
  replace({
    regex: 'app:///img',
    replacement: 'app://./img',
    paths: files.map((val) => path.join(workDir, val)),
    recursive: false,
    silent: true,
  })
  return true
}
