import { useQuery } from 'vue-query'

export const useGetAppInfoQuery = () => useQuery('app-info', () =>
    window.ElectronSI.getInfo(),
)