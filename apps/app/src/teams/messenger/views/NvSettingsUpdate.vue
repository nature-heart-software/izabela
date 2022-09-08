<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Update</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Update Channel</NvText>
          </NvStack>
          <NvUpdateChannelSelect
            :modelValue="settingsStore.updateChannel"
            @update:modelValue="
              (value) => settingsStore.$patch({ updateChannel: value })
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import NvUpdateChannelSelect from '@/features/update/components/inputs/NvUpdateChannelSelect.vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

</script>
