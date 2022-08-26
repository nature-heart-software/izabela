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
            multiple
            :modelValue="store.getters['settings/persisted'].keybindings.toggleMessengerWindow"
            @update:modelValue="
              (value) =>
                store.dispatch('settings/setProperty', [
                  'persisted.keybindings.toggleMessengerWindow',
                  value,
                ])
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import NvKeybinding from '@/entities/app/components/inputs/NvKeybinding.vue'
import { useStore } from 'vuex'

const store = useStore()
</script>
