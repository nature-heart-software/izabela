<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Auto Update</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Auto Update Channel</NvText>
          </NvStack>
          <NvAutoUpdateChannelSelect
            :modelValue="store.getters['settings/persisted'].autoUpdateChannel"
            @update:modelValue="
              (value) =>
                store.dispatch('settings/setProperty', ['persisted.autoUpdateChannel', value])
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
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
    <NvStack>
      <NvText type="subtitle">Development</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Debug mode</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="store.getters['settings/persisted'].debugMode"
            @update:modelValue="
              (value) => store.dispatch('settings/setProperty', ['persisted.debugMode', value])
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvSwitch, NvText } from '@/core/components'
import NvAutoUpdateChannelSelect
  from '@/entities/settings/components/inputs/NvAutoUpdateChannelSelect.vue'
import { useStore } from 'vuex'

const store = useStore()
</script>
