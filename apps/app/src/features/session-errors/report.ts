import sessionErrors, { normalizeProviderId } from './index'
import type { ErrorCategory, ErrorOperation } from './store'

const connectionCodes = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'ECONNABORTED',
  'ERR_NETWORK',
  'UND_ERR_CONNECT_TIMEOUT',
  14,
])
const subscriptionCodes = new Set([
  'insufficient_quota',
  'subscription_required',
  'subscription_expired',
  'payment_required',
  'billing_hard_limit_reached',
  'quota_exceeded',
])

/** Only inspect known metadata; never serialize an SDK error or request into UI state. */
export function classifyProviderError(
  error: unknown,
): ErrorCategory | undefined {
  const visited = new Set<unknown>()
  function classify(value: any, depth = 0): ErrorCategory | undefined {
    if (!value || typeof value !== 'object' || depth > 4 || visited.has(value))
      return 'other'
    visited.add(value)
    if (
      value.name === 'AbortError' ||
      value.name === 'CanceledError' ||
      value.code === 'ERR_CANCELED'
    )
      return undefined
    const status =
      value.status ??
      value.statusCode ??
      value.response?.status ??
      value.$metadata?.httpStatusCode
    if (status === 402 || subscriptionCodes.has(value.code))
      return 'subscription'
    if (
      connectionCodes.has(value.code) ||
      (value.name === 'TypeError' &&
        /^(Failed to fetch|fetch failed|NetworkError when attempting to fetch resource\.)$/.test(
          value.message,
        ))
    )
      return 'connection'
    for (const nested of [
      value.cause,
      value.error,
      value.response?.data?.error,
    ]) {
      if (!nested) continue
      const category = classify(nested, depth + 1)
      if (category !== 'other') return category
    }
    return 'other'
  }
  return classify(error)
}

/** Discard provider messages, request bodies and credentials before crossing IPC. */
export function reportProviderError(
  error: unknown,
  operation: ErrorOperation,
  provider?: string,
) {
  const category = classifyProviderError(error)
  if (!category) return
  const entry = { category, operation, provider: normalizeProviderId(provider) }
  if (typeof window !== 'undefined') {
    void Promise.resolve(window.ElectronSessionErrors.report(entry)).catch(
      () => {},
    )
  } else sessionErrors.report(entry)
}
