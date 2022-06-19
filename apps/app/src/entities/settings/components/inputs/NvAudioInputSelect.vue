<template>
  <NvStack spacing="5">
    <NvGroup align="start" no-wrap justify="apart">
      <NvStack>
        <NvText type="label">Import Google Cloud Speech Credentials</NvText>
        <NvText
          >Izabela uses Google Cloud Speech for speech recognition which requires credentials to be
          imported
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
    <template v-if="googleCloudSpeechCredentialsPath">
      <NvDivider direction="horizontal" />
      <NvFormItem label="Audio Input">
        <NvSelect
          :modelValue="$store.getters['settings/persisted'].audioInputDevice"
          @update:modelValue="
            (value) =>
              $store.dispatch('settings/setProperty', ['persisted.audioInputDevice', value])
          "
        >
          <template v-for="audioInputDevice in audioInputDevices" :key="audioInputDevice.deviceId">
            <NvOption :label="audioInputDevice.label" :value="audioInputDevice.label">
              {{ audioInputDevice.label }}
            </NvOption>
          </template>
        </NvSelect>
      </NvFormItem>
    </template>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvIcon,
  NvOption,
  NvSelect,
  NvStack,
  NvText,
} from '@/core/components'
import { useMediaDevices } from '@/hooks'
import {
  getGoogleCloudSpeechCredentialsPathQueryKey,
  useGetGoogleCloudSpeechCredentialsPath,
} from '@/entities/settings/hooks'
import { useQueryClient } from 'vue-query'

const { ElectronDialog, ElectronFilesystem } = window
const { audioInputDevices } = useMediaDevices()

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
