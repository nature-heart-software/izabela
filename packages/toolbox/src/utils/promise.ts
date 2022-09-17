export function Deferred<T>() {
  let resolveFn!: (value: T | PromiseLike<T>) => void
  let rejectFn!: (reason?: any) => void
  const promise: Promise<T> = new Promise<T>((rslv, rjct) => {
    resolveFn = rslv
    rejectFn = rjct
  })

  function reject(reason?: any): void {
    rejectFn(reason)
  }

  function resolve(param: T): void {
    resolveFn(param)
  }

  return {
    promise,
    resolve,
    reject,
  }
}
