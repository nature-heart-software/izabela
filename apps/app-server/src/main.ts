import server from './server'

const args = process.argv.slice(2)
if (args.includes('--start-server')) {
  server.start()
}

export default server
