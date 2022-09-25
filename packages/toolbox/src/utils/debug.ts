export const log = <A extends any[] = any[]>(...args: A) => {
  console.log(...args)
  return args[0]
}
