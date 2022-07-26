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
              <NvAudioOutputsSelect />
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
              <NvAudioInputFormPart />
            </NvCard>
          </div>
        </NvStack>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvStack, NvText } from '@/core/components'
import NvAudioOutputsSelect from '@/entities/settings/components/inputs/NvAudioOutputsSelect.vue'
import NvAudioInputFormPart from '@/entities/settings/components/inputs/NvAudioInputFormPart.vue'
</script>
