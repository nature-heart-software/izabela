import { useQuery } from 'vue-query'

const { ElectronFilesystem } = window

export const getGoogleCloudSpeechCredentialsPathQueryKey = 'getGoogleCloudSpeechCredentialsPath'

export const useGetGoogleCloudSpeechCredentialsPath = () => useQuery(getGoogleCloudSpeechCredentialsPathQueryKey, () =>
    ElectronFilesystem.getGoogleCloudSpeechCredentialsPath(),
  )
