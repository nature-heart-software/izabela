<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Audio</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvStack>
            <NvText type="subtitle">Audio Outputs</NvText>
            <NvText>Select audio outputs where speech should be played on</NvText>
            <NvText type="caption">You can select up to 5 audio outputs</NvText>
          </NvStack>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <AudioOutputsSelect/>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvStack, NvText, NvCard } from '@/core/components'
import AudioOutputsSelect from '@/entities/settings/components/inputs/AudioOutputsSelect.vue'

export default defineComponent({
  name: 'SettingsOverview',
  components: {
    NvCard,
    NvStack,
    NvText,
    AudioOutputsSelect,
  },
})
</script>
