<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Audio</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvStack>
              <NvText type="label">Audio Outputs</NvText>
              <NvText>Select audio outputs where Izabela's speech should be played on</NvText>
            </NvStack>
          </NvCard>
          <div class="pl-8">
            <NvCard>
              <NvStack spacing="5">
                <NvGroup justify="apart">
                  <NvText type="label">Play Izabela's speech on default playback device</NvText>
                  <NvSwitch
                    :modelValue="settingsStore.playSpeechOnDefaultPlaybackDevice"
                    @update:modelValue="
                      (value) =>
                        settingsStore.$patch({
                          playSpeechOnDefaultPlaybackDevice: value,
                        })
                    "
                  />
                </NvGroup>
                <NvDivider direction="horizontal"/>
                <NvFormItem label="Audio Outputs">
                  <NvAudioOutputsSelect/>
                </NvFormItem>
                <NvDivider direction="horizontal"/>

                <NvGroup align="start" justify="apart" no-wrap>
                  <NvStack>
                    <NvText type="label">Install VB-Audio Virtual Cable</NvText>
                    <NvText
                    >VB-Audio Virtual Cable creates a virtual audio cable that can be used as a
                      recording device for Izabela's speech in other applications
                    </NvText>
                    <NvText type="caption"
                    >VB-Audio Virtual Cable must also be present in Audio Outputs<br/>
                      A restart may be required after installation
                    </NvText>
                    <template v-if="isVirtualAudioCableInstalled">
                      <NvText type="caption">
                        <NvGroup>
                          <NvIcon name="check-circle" size="3"/>
                          <span>Virtual audio cable found</span>
                        </NvGroup>
                      </NvText>
                    </template>
                    <template v-else>
                      <NvText type="caption">
                        <NvGroup>
                          <NvIcon name="exclamation-triangle" size="3"/>
                          <span>Virtual audio cable not found</span>
                        </NvGroup>
                      </NvText>
                    </template>
                  </NvStack>
                  <template v-if="isVirtualAudioCableInstalled">
                    <NvButton
                      :loading="isVirtualAudioCableInstalledFetching"
                      @click="ElectronResources.uninstallVirtualAudioCable().then(refetchIsVirtualAudioCableInstalled).catch(refetchIsVirtualAudioCableInstalled)">
                      Uninstall
                    </NvButton>
                  </template>
                  <template v-else>
                    <NvButton
                      :loading="isVirtualAudioCableInstalledFetching"
                      @click="ElectronResources.installVirtualAudioCable().then(refetchIsVirtualAudioCableInstalled).catch(refetchIsVirtualAudioCableInstalled)">
                      Install
                    </NvButton>
                  </template>
                </NvGroup>
              </NvStack>
            </NvCard>
          </div>
        </NvStack>
        <NvStack spacing="4">
          <NvCard>
            <NvStack>
              <NvText type="label">Audio Input</NvText>
              <NvText>Select an audio input to generate Izabela's speech from</NvText>
            </NvStack>
          </NvCard>
          <div class="pl-8">
            <NvCard>
              <NvAudioInputFormPart/>
            </NvCard>
          </div>
        </NvStack>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvIcon,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvAudioOutputsSelect from '@/features/audio/components/inputs/NvAudioOutputsSelect.vue'
import NvAudioInputFormPart from '@/features/audio/components/inputs/NvAudioInputFormPart.vue'
import { useSettingsStore } from '@/features/settings/store'
import { useIsVirtualAudioCableInstalled } from '@/features/audio/hooks'

const { ElectronResources } = window
const settingsStore = useSettingsStore()
const {
  data: isVirtualAudioCableInstalled,
  isFetching: isVirtualAudioCableInstalledFetching,
  refetch: refetchIsVirtualAudioCableInstalled,
} = useIsVirtualAudioCableInstalled()
</script>
