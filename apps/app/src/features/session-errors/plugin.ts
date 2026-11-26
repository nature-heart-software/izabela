import type { App } from 'vue'
import { QueryCache } from 'vue-query'
import { reportProviderError } from '@/features/session-errors/report'

export const sessionQueryOptions = () => ({
  queryClientConfig: {
    queryCache: new QueryCache({
      onError: (error) => reportProviderError(error, 'provider'),
    }),
  },
})

/** Retain errors from asynchronous renderer work that has no provider-specific handler. */
export const sessionErrorReporting = {
  install(app: App) {
    const previous = app.config.errorHandler
    app.config.errorHandler = (error, instance, info) => {
      reportProviderError(error, 'provider')
      if (previous) previous(error, instance, info)
      else console.error(error)
    }
    const onRejection = (event: PromiseRejectionEvent) =>
      reportProviderError(event.reason, 'provider')
    window.addEventListener('unhandledrejection', onRejection)
    app.onUnmount(() =>
      window.removeEventListener('unhandledrejection', onRejection),
    )
  },
}
