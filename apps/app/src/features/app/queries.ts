import { useMutation, useQuery } from 'vue-query'

export const useGetAppInfoQuery = () =>
  useQuery('app-info', () => window.ElectronSI.getInfo())

export const useClearCacheMutation = () =>
  useMutation({
    mutationFn() {
      return window.ElectronFilesystem.clearCache()
    },
  })
