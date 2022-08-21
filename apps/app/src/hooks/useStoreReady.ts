import { useStore } from 'vuex'
import { useQuery } from 'vue-query'

const useStoreReady = () => {
  const store = useStore()
  return useQuery('store-ready', () => store.getters.isReady())
}

export default useStoreReady
