<script lang="ts" setup>
// Because the audio input value is the index of the audio input device on the system
// we need to update the value when the audio input device changes before or during runtime.
import { useLocalStorage } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'
import { watch } from 'vue'
import { getSoxMediaDeviceByIndex } from '@/utils/media-devices'
import { useSoxDevicesList } from '@/features/audio/hooks'

const audioInputs = useSoxDevicesList()
const settingsStore = useSettingsStore()
const audioInputLabel = useLocalStorage('audioInputLabel', '')

watch(
  () => [audioInputs.value, audioInputLabel.value],
  async () => {
    if (audioInputLabel.value) {
      const targetAudioDeviceIndex = audioInputs.value.findIndex(
        (input) =>
          audioInputLabel.value.includes(input.label) ||
          input.label.includes(audioInputLabel.value),
      )
      if (targetAudioDeviceIndex > -1 && targetAudioDeviceIndex !== settingsStore.soxDevice) {
        settingsStore.$patch({ soxDevice: targetAudioDeviceIndex })
      }
    }
  },
  { immediate: true },
)

watch(
  () => settingsStore.soxDevice,
  async (newValue) => {
    const audioDevice = await getSoxMediaDeviceByIndex(newValue)
    if (audioDevice) audioInputLabel.value = audioDevice.label
  },
  { immediate: false },
)
</script>
