export const purify = (o: object | []) => {
  return JSON.parse(JSON.stringify(o))
}
