<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Translation</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Translation</NvText>
              <NvText>Translate messages before generating speech</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvTranslationForm />
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import NvTranslationForm from '@/features/translation/components/forms/NvTranslationForm.vue'

const settingsStore = useSettingsStore()
</script>
