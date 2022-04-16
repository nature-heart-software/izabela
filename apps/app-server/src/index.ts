import izabelaServer from './server'

export default izabelaServer

if (require.main !== module) {
  izabelaServer.startServer()
}
