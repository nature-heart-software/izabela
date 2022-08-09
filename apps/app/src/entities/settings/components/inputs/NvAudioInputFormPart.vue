<template>
  <NvStack spacing="5">
    <NvGroup align="start" justify="apart" no-wrap>
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
    <NvAccessBlocker :allowed="googleCloudSpeechCredentialsPath" reason="Credentials required">
      <NvStack spacing="5">
        <NvDivider direction="horizontal" />
        <NvFormItem label="Audio Input">
          <NvSelect
            :modelValue="store.getters['settings/persisted'].audioInputDevice"
            @update:modelValue="
              (value) =>
                store.dispatch('settings/setProperty', ['persisted.audioInputDevice', value])
            "
          >
            <template
              v-for="audioInputDevice in audioInputDevices"
              :key="audioInputDevice.deviceId"
            >
              <NvOption :label="audioInputDevice.label" :value="audioInputDevice.label">
                {{ audioInputDevice.label }}
              </NvOption>
            </template>
          </NvSelect>
        </NvFormItem>
        <NvDivider direction="horizontal" />
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Push-to-record Key</NvText>
          </NvStack>
          <NvKeybinding
            :modelValue="store.getters['settings/persisted'].recordAudioKeybinding"
            @update:modelValue="
              (value) =>
                store.dispatch('settings/setProperty', ['persisted.recordAudioKeybinding', value])
            "
          />
        </NvGroup>
      </NvStack>
    </NvAccessBlocker>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvButton,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvIcon,
  NvOption,
  NvSelect,
  NvStack,
  NvText,
} from '@izabela/ui'
import NvKeybinding from '@/entities/app/components/inputs/NvKeybinding.vue'
import { useMediaDevices } from '@/hooks'
import {
  getGoogleCloudSpeechCredentialsPathQueryKey,
  useGetGoogleCloudSpeechCredentialsPath,
} from '@/entities/settings/hooks'
import { useQueryClient } from 'vue-query'
import { useStore } from 'vuex'

const store = useStore()
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
