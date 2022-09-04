import { ShareStatePayload } from './types'

export function purify(o?: object | [] | null) {
  if (typeof o === 'object') {
    return JSON.parse(JSON.stringify(o))
  }
  return o
}

export function useArgs(args: ShareStatePayload['args']) {
  const issuer =
      args.find((arg) => typeof arg === 'object' && arg.issuer)?.issuer ||
      'main'

  const newArgs = [
    ...args.filter((o) => typeof o !== 'object' || !o.issuer),
    { issuer },
  ]

  return {
    issuer,
    args: newArgs,
  }
}
