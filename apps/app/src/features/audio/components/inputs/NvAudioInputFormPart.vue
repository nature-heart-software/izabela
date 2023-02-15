<template>
  <NvStack spacing="5">
    <NvGroup justify="apart" no-wrap spacing="5">
      <NvStack>
        <NvText type="label">Enable speech-to-text-to-speech</NvText>
        <NvText type="caption">This might prevent your device from going to sleep</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="settingsStore.enableSTTTS"
        class="shrink-0"
        @update:modelValue="
          (value) => settingsStore.$patch({ enableSTTTS: value })
        "
      />
    </NvGroup>
    <NvAccessBlocker
      :allowed="settingsStore.enableSTTTS"
      reason="Speech-to-text-to-speech needs to be enabled"
    >
      <NvStack spacing="5">
        <NvDivider direction="horizontal"/>
        <NvGroup align="start" justify="apart" no-wrap>
          <NvStack>
            <NvText type="label">Import Google Cloud Speech Credentials</NvText>
            <NvText
            >Izabela uses Google Cloud Speech for speech recognition which requires credentials to
              be
              imported
            </NvText>
            <template v-if="googleCloudSpeechCredentialsPath">
              <NvText type="caption">
                <NvGroup>
                  <NvIcon name="check-circle" size="3"/>
                  <span>Credentials found</span>
                </NvGroup>
              </NvText>
            </template>
            <template v-else>
              <NvText type="caption">
                <NvGroup>
                  <NvIcon name="exclamation-triangle" size="3"/>
                  <span>Credentials not found</span>
                </NvGroup>
              </NvText>
            </template>
          </NvStack>
          <NvButton @click="importGoogleCloudSpeechCredentials">Import</NvButton>
        </NvGroup>
        <NvDivider direction="horizontal"/>
        <NvFormItem label="Audio Input">
          <NvAudioInputSelect/>
        </NvFormItem>
        <NvAccessBlocker
          :allowed="!settingsStore.automaticSpeechDetection"
          reason="Available when automatic speech detection is disabled"
        >
          <NvStack :spacing="5">
            <NvDivider direction="horizontal"/>
            <NvGroup justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Push-to-record Key</NvText>
                <NvText>Key to press in order to record speech</NvText>
                <NvText type="caption">Release the key to transcribe speech</NvText>
              </NvStack>
              <NvKeybinding
                :modelValue="settingsStore.keybindings.recordAudio"
                @update:modelValue="
          (value) => settingsStore.$patch({ keybindings: { recordAudio: value } })
        "
              />
            </NvGroup>
          </NvStack>
        </NvAccessBlocker>
        <NvDivider direction="horizontal"/>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Automatic speech detection</NvText>
            <NvText>Automatically record and transcribe speech when it is detected
            </NvText>
            <NvText type="caption">This might affect performance on some devices
            </NvText>
          </NvStack>
          <NvSwitch
            :modelValue="settingsStore.automaticSpeechDetection"
            class="shrink-0"
            @update:modelValue="
          (value) => settingsStore.$patch({ automaticSpeechDetection: value })
        "
          />
        </NvGroup>
        <NvAccessBlocker
          :allowed="settingsStore.automaticSpeechDetection"
          reason="Available when automatic speech detection is enabled"
        >
          <NvStack :spacing="5">
            <NvDivider direction="horizontal"/>
            <NvGroup justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvStack>
                  <NvText type="label">Activation threshold</NvText>
                  <NvText>Minimum volume required to record speech (dB)
                  </NvText>
                  <NvText type="caption">A lower value activates the recording more easily
                  </NvText>
                </NvStack>
              </NvStack>
              <NvNumberInput
                :modelValue="settingsStore.audioInputSensibility"
                @update:modelValue="
          (value) => settingsStore.$patch({ audioInputSensibility: value })
        "
              />
            </NvGroup>
            <NvDivider direction="horizontal"/>
            <NvGroup justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvStack>
                  <NvText type="label">Pre-recording time</NvText>
                  <NvText>Amount of time recorded before speech detection (ms)
                  </NvText>
                  <NvText type="caption">This prevents words from being cut-off</NvText>
                </NvStack>
              </NvStack>
              <NvNumberInput
                :min="100"
                :modelValue="settingsStore.speechPrerecordTime"
                @update:modelValue="
          (value) => settingsStore.$patch({ speechPrerecordTime: value })
        "
              />
            </NvGroup>
            <NvDivider direction="horizontal"/>
            <NvGroup justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvStack>
                  <NvText type="label">Post-recording time</NvText>
                  <NvText>Amount of silence required to start speech transcription (ms)
                  </NvText>
                </NvStack>
              </NvStack>
              <NvNumberInput
                :modelValue="settingsStore.speechPostrecordTime"
                @update:modelValue="
          (value) => settingsStore.$patch({ speechPostrecordTime: value })
        "
              />
            </NvGroup>
          </NvStack>
        </NvAccessBlocker>
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
  NvNumberInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useQueryClient } from 'vue-query'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import {
  getGoogleCloudSpeechCredentialsPathQueryKey,
  useGetGoogleCloudSpeechCredentialsPath,
} from '@/features/settings/hooks'
import NvAudioInputSelect from '@/features/audio/components/inputs/NvAudioInputSelect.vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

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
