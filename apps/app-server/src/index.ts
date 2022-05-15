import izabelaServer from './server'

const args = process.argv.slice(2)
if (args.includes('--start-server')) {
  izabelaServer.startServer()
}

module.exports = izabelaServer
