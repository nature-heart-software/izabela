<template>
  <NvStack spacing="5">
    <NvGroup position="apart">
      <NvText type="label">Play Izabela's speech on default playback device</NvText>
      <NvSwitch
        :modelValue="$store.getters['settings/persisted'].playSpeechOnDefaultPlaybackDevice"
        @update:modelValue="(value) => $store.dispatch('settings/setProperty', ['persisted.playSpeechOnDefaultPlaybackDevice', value])
        "
      />
    </NvGroup>
    <NvDivider direction="horizontal"/>
    <NvFormItem label="Audio Outputs">
      <NvSelect multiple :modelValue="$store.getters['settings/persisted'].audioOutputDevices"
                @update:modelValue="(value) => $store.dispatch('settings/setProperty', ['persisted.audioOutputDevices', value])
        ">
        <template v-for="audioOutputDevice in audioOutputDevices" :key="audioOutputDevice.deviceId">
          <NvOption :label="audioOutputDevice.label" :value="audioOutputDevice.deviceId">
            {{ audioOutputDevice.label }}
          </NvOption>
        </template>
      </NvSelect>
    </NvFormItem>
    <NvDivider direction="horizontal"/>

    <NvGroup position="apart" no-wrap align="start">
      <NvStack>
        <NvText type="label">Install VB-Audio Virtual Cable</NvText>
        <NvText>VB-Audio Virtual Cable creates a virtual audio cable that can be used as a recording
          device
          for Izabela's speech in other applications
        </NvText>
        <NvText type="caption">VB-Audio Virtual Cable must also be present in Audio
          Outputs
        </NvText>
      </NvStack>
      <NvButton>Install</NvButton>
    </NvGroup>
  </NvStack>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import {
  NvStack,
  NvText,
  NvSwitch,
  NvGroup,
  NvSelect,
  NvOption,
  NvButton,
} from '@/core/components'
import NvFormItem from '@/core/components/Form/NvFormItem.vue'
import { orderBy } from 'lodash'
import NvDivider from '@/core/components/Divider/NvDivider.vue'

export default defineComponent({
  components: {
    NvDivider,
    NvText,
    NvStack,
    NvSwitch,
    NvGroup,
    NvSelect,
    NvOption,
    NvFormItem,
    NvButton,
  },

  setup() {
    const mediaDevices = ref<MediaDeviceInfo[]>([])
    const updateMediaDevices = () => navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        mediaDevices.value = devices
        return devices
      })
    window.addEventListener('devicechange', updateMediaDevices)
    updateMediaDevices()
    const audioOutputDevices = computed(() => orderBy(mediaDevices.value.filter((m) => m.kind === 'audiooutput' && m.deviceId !== 'default'), ['label']))
    return {
      audioOutputDevices,
    }
  },
})
</script>
