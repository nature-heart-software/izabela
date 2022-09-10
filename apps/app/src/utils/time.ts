export const getTime = () => {
  const now = new Date()
  return `${ now.getHours() }:${ now.getMinutes() }:${ now.getSeconds() }`
}
