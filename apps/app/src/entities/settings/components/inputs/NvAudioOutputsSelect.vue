<template>
  <NvStack spacing="5">
    <NvGroup justify="apart">
      <NvText type="label">Play Izabela's speech on default playback device</NvText>
      <NvSwitch
        :modelValue="store.getters['settings/persisted'].playSpeechOnDefaultPlaybackDevice"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', [
              'persisted.playSpeechOnDefaultPlaybackDevice',
              value,
            ])
        "
      />
    </NvGroup>
    <NvDivider direction="horizontal"/>
    <NvFormItem label="Audio Outputs">
      <NvSelect
        :modelValue="store.getters['settings/persisted'].audioOutputDevices"
        multiple
        @update:modelValue="
          (value) => store.dispatch('settings/setProperty', ['persisted.audioOutputDevices', value])
        "
      >
        <template
          v-for="audioOutputDevice in filteredAudioOutputDevices"
          :key="audioOutputDevice.deviceId"
        >
          <NvOption :label="audioOutputDevice.label" :value="audioOutputDevice.label">
            {{ audioOutputDevice.label }}
          </NvOption>
        </template>
      </NvSelect>
    </NvFormItem>
    <NvDivider direction="horizontal"/>

    <NvGroup align="start" justify="apart" no-wrap>
      <NvStack>
        <NvText type="label">Install VB-Audio Virtual Cable</NvText>
        <NvText
        >VB-Audio Virtual Cable creates a virtual audio cable that can be used as a recording
          device for Izabela's speech in other applications
        </NvText>
        <NvText type="caption"
        >VB-Audio Virtual Cable must also be present in Audio Outputs
        </NvText>
      </NvStack>
      <NvButton>Install</NvButton>
    </NvGroup>
  </NvStack>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import {
  NvButton,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvOption,
  NvSelect,
  NvStack,
  NvSwitch,
  NvText,
} from '@izabela/ui'
import { useMediaDevices } from '@/hooks'
import { useStore } from 'vuex'

const store = useStore()
const { audioOutputDevices } = useMediaDevices()

const filteredAudioOutputDevices = computed(() =>
  audioOutputDevices.value.filter((d) => d.deviceId !== 'default'),
)
</script>
