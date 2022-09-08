<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Display</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Monitor</NvText>
          </NvStack>
          <NvKeybinding
            :modelValue="settingsStore.keybindings.toggleMessengerWindow"
            multiple
            @update:modelValue="
              (value) => settingsStore.$patch({ keybindings: { toggleMessengerWindow: value } })
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

</script>
