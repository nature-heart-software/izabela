import { useStore } from 'vuex'
import { useQuery } from 'vue-query'

const useStoreReady = () => {
  const store = useStore()
  return useQuery('store-ready', () => store.state['electron-vuex'].ready())
}

export default useStoreReady
