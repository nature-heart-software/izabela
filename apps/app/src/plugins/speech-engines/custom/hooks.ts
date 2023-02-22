import { Ref } from 'vue'
import { useQuery, UseQueryOptions } from 'vue-query'
import axios from 'axios'
import { LIST_VOICES_QUERY_KEY } from './shared'

export const useListVoicesQuery = (
  params: Ref<{
    endpoint: string
    credentials: {
      apiKey: string
    }
  }>,
  options?: UseQueryOptions,
) =>
  useQuery<any>(
    LIST_VOICES_QUERY_KEY,
    () =>
      axios
        .post(
          `${
            params.value.endpoint.endsWith('/')
              ? params.value.endpoint.slice(0, -1)
              : params.value.endpoint
          }/list-voices`,
          { credentials: params.value.credentials },
        )
        .then(({ data }) => data),
    options,
  )
