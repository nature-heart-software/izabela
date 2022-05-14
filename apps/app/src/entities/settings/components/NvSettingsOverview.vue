<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Auto Update</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvGroup no-wrap position="apart" spacing="5">
              <NvStack>
                <NvText type="label">Auto Update Channel</NvText>
              </NvStack>
              <NvAutoUpdateChannelSelect
                :modelValue="$store.getters['settings/persisted'].autoUpdateChannel"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.autoUpdateChannel', value])
                "
              />
            </NvGroup>
          </NvCard>
        </NvStack>
      </NvStack>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Startup</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvGroup no-wrap position="apart" spacing="5">
              <NvStack>
                <NvText type="label">Launch on startup</NvText>
              </NvStack>
              <NvSwitch
                :modelValue="$store.getters['settings/persisted'].launchOnStartup"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.launchOnStartup', value])
                "
              />
            </NvGroup>
          </NvCard>
        </NvStack>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@/core/components'
import NvAutoUpdateChannelSelect from '@/entities/settings/components/inputs/NvAutoUpdateChannelSelect.vue'
import NvSwitch from '@/core/components/Switch/NvSwitch.vue'
</script>
