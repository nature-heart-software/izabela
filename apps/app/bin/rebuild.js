#!/usr/bin/node

const { spawn } = require('child_process')

const child = spawn('npm', ['run', 'rebuild'], {
  shell: true,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
