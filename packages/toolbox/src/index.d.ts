declare module '@ungap/structured-clone' {
  function structuredClone<T>(o: T): T

  export function serialize<T>(o: T): string

  export function deserialize<T>(s: string): T

  export default structuredClone
}

declare module '@ungap/structured-clone/json' {
  export function stringify<T>(o: T): string

  export function parse<T>(s: string): T
}
