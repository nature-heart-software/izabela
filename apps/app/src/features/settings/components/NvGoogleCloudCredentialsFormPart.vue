<template>
  <NvGroup align="start" justify="apart" no-wrap>
    <NvStack>
      <NvGroup>
        <NvText type="label">Google Cloud credentials</NvText>
        <NvText> (required)</NvText>
      </NvGroup>
      <NvText>
        <slot />
      </NvText>
      <template v-if="googleCloudSpeechCredentialsPath">
        <NvText type="caption">
          <NvGroup>
            <NvIcon name="check-circle" size="3" />
            <span>Credentials found</span>
          </NvGroup>
        </NvText>
      </template>
      <template v-else>
        <NvText type="caption">
          <NvGroup>
            <NvIcon name="exclamation-triangle" size="3" />
            <span>Credentials not found</span>
          </NvGroup>
        </NvText>
      </template>
    </NvStack>
    <NvButton @click="importGoogleCloudSpeechCredentials">Import</NvButton>
  </NvGroup>
</template>

<script lang="ts" setup>
import { NvButton, NvGroup, NvIcon, NvStack, NvText } from '@packages/ui'
import {
  getGoogleCloudSpeechCredentialsPathQueryKey,
  useGetGoogleCloudSpeechCredentialsPath,
} from '@/features/settings/hooks'
import { useQueryClient } from 'vue-query'

const { ElectronDialog, ElectronFilesystem } = window
const queryClient = useQueryClient()
const importGoogleCloudSpeechCredentials = () => {
  ElectronDialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
    .then(({ filePaths }) => ElectronFilesystem.importGoogleCloudSpeechCredentials(filePaths[0]))
    .then(() => {
      queryClient.refetchQueries(getGoogleCloudSpeechCredentialsPathQueryKey)
    })
}
const { data: googleCloudSpeechCredentialsPath } = useGetGoogleCloudSpeechCredentialsPath()
</script>
