<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Development</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Debug mode</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="settingsStore.debugMode"
            @update:modelValue="(value) => settingsStore.$patch({ debugMode: value })"
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvSwitch, NvText } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
</script>
