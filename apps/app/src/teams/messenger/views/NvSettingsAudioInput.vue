<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Audio input</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvStack>
            <NvGroup>
              <NvText type="label">Audio input</NvText>
              <NvText>(optional)</NvText>
            </NvGroup>
            <NvText>Generate audio using your voice (speech-to-text-to-speech)</NvText>
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
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import NvAudioInputFormPart from '@/features/audio/components/inputs/NvAudioInputFormPart.vue'</script>
