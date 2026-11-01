export const log = <A extends any[] = any[]>(...args: A): A[0] => {
  console.log(...args)
  return args[0]
}
