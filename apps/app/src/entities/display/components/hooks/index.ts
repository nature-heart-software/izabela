import { useQuery } from 'vue-query'

const { ElectronDisplay } = window

export const useGetAllDisplaysQuery = () => useQuery(['getAllDisplays'], () => ElectronDisplay.getAllDisplays())
export const useGetPrimaryDisplayQuery = () => useQuery(['getPrimaryDisplay'], () => ElectronDisplay.getPrimaryDisplay())
