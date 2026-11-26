import {
  useSessionErrorsStore,
  type SessionError,
} from '@/features/session-errors/store'

// Main need not load renderer plugins. Bound opaque IDs without restricting the registry's alphabet.
export function normalizeProviderId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
    ? value
    : undefined
}

export default {
  report(input: Pick<SessionError, 'category' | 'operation' | 'provider'>) {
    const store = useSessionErrorsStore()
    const revision = store.revision + 1
    const entry: SessionError = {
      id: String(revision),
      createdAt: new Date().toISOString(),
      category:
        input?.category === 'connection'
          ? 'connection'
          : input?.category === 'subscription'
            ? 'subscription'
            : 'other',
      operation: ['speech', 'speech-recognition', 'translation'].includes(
        input?.operation,
      )
        ? input.operation
        : 'provider',
      provider: normalizeProviderId(input?.provider),
    }
    store.$patch({
      entries: [...store.entries, entry],
      hasOccurred: true,
      revision,
    })
  },
  read() {
    const store = useSessionErrorsStore()
    return {
      entries: store.entries.map((entry) => ({ ...entry })),
      hasOccurred: store.hasOccurred,
      revision: store.revision,
    }
  },
  clear() {
    const store = useSessionErrorsStore()
    store.$patch({ entries: [], revision: store.revision + 1 })
  },
}
