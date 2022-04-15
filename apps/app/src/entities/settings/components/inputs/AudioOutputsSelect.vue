<template>
  <NvStack>
    <NvGroup position="apart">
      <NvText>Play speech on default playback device</NvText>
      <NvSwitch
        :modelValue="$store.getters['settings/persisted'].playSpeechOnDefaultPlaybackDevice"
        @update:modelValue="
          (value) =>
            $store.dispatch('settings/setProperty', [
              'persisted.playSpeechOnDefaultPlaybackDevice',
              value,
            ])
        "
      />
    </NvGroup>
    <NvSelect
      multiple
      :multiple-limit="5"
      :modelValue="$store.getters['settings/persisted'].audioOutputDevices"
      @update:modelValue="
        (value) => $store.dispatch('settings/setProperty', ['persisted.audioOutputDevices', value])
      "
    >
      <template v-for="audioOutputDevice in audioOutputDevices" :key="audioOutputDevice.deviceId">
        <NvOption :label="audioOutputDevice.label" :value="audioOutputDevice.deviceId">
          {{ audioOutputDevice.label }}
        </NvOption>
      </template>
    </NvSelect>
  </NvStack>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { NvStack, NvText, NvSwitch, NvGroup, NvSelect, NvOption } from '@/core/components'
import { orderBy } from 'lodash'

export default defineComponent({
  components: {
    NvText,
    NvStack,
    NvSwitch,
    NvGroup,
    NvSelect,
    NvOption,
  },

  setup() {
    const mediaDevices = ref<MediaDeviceInfo[]>([])
    const updateMediaDevices = () =>
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        mediaDevices.value = devices
        return devices
      })
    window.addEventListener('devicechange', updateMediaDevices)
    updateMediaDevices()
    const audioOutputDevices = computed(() =>
      orderBy(
        mediaDevices.value.filter((m) => m.kind === 'audiooutput' && m.deviceId !== 'default'),
        ['label'],
      ),
    )
    return {
      audioOutputDevices,
    }
  },
})
</script>
