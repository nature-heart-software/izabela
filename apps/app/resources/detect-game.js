const { getProcessInfo } = require('windows-tlist')
const wqlImport = import('wql-process-monitor')

function send(...args) {
  process.send(...args)
}

wqlImport.then((wql) => {
  const { subscribe } = wql
  return subscribe({
    creation: true,
    deletion: false,
    bin: {
      filter: ['cmd.exe', 'tlist.exe', 'conhost.exe'],
    },
  })
})
  .then((processMonitor) => {

    processMonitor.on('creation', ([process, pid, filepath, user]) => {
      
      console.log(`[game-detection]: process creation - ${process}::${pid}(${user}) ["${filepath}"]`)
      // getProcessInfo(pid)
      //   .then(processInfo => {
      const isGame = [
        // processInfo.modules.find(module => module.path.includes('d3d')),
        // processInfo.modules.find(module => module.path.includes('dxgi')),
        // processInfo.modules.find(module => module.path.includes('steamapps')),
        filepath.includes('steamapps'),
      ].every(Boolean)
      if (isGame) {
        console.log('[game-detection]: Game launched', filepath)
        send({
          type: 'game-detection',
          payload: {
            process, pid, filepath, user,
          },
        })
      }
      // })
    })
  })

setInterval(() => {
}, 1000 * 60 * 60)

