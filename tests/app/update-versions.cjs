const { version: baseline } = require('../../apps/app/package.json')
const [major, minor, patch] = baseline.split('-')[0].split('.')
module.exports = {
  baseline,
  candidate: `${major}.${minor}.${Number(patch) + 1}`,
}
