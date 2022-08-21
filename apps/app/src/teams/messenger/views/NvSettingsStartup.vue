<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Startup</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Launch on startup</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="store.getters['settings/persisted'].launchOnStartup"
            @update:modelValue="
              (value) =>
                store.dispatch('settings/setProperty', ['persisted.launchOnStartup', value])
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvSwitch, NvText } from '@packages/ui'
import { useStore } from 'vuex'

const store = useStore()
</script>
