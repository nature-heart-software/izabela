export const purify = (o: object | array) => {
  return JSON.parse(JSON.stringify(o))
}
