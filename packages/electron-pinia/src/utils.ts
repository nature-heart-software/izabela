export function purify(o?: object | [] | null) {
  if (typeof o === 'object') {
    return JSON.parse(JSON.stringify(o))
  }
  return o
}
