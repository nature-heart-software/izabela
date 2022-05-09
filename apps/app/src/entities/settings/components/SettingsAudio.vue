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
              <AudioOutputsSelect />
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
              <AudioInputSelect />
            </NvCard>
          </div>
        </NvStack>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvCard, NvStack, NvText } from '@/core/components'
import AudioOutputsSelect from '@/entities/settings/components/inputs/AudioOutputsSelect.vue'
import AudioInputSelect from '@/entities/settings/components/inputs/AudioInputSelect.vue'

export default defineComponent({
  name: 'SettingsAudio',
  components: {
    NvCard,
    NvStack,
    NvText,
    AudioOutputsSelect,
    AudioInputSelect,
  },
})
</script>
