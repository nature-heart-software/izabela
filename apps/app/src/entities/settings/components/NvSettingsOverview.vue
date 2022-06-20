<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Auto Update</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvGroup no-wrap justify="apart" spacing="5">
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
            <NvGroup no-wrap justify="apart" spacing="5">
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
    <NvStack>
      <NvText type="subtitle">Keybinds</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvGroup no-wrap justify="apart" spacing="5">
              <NvStack>
                <NvText type="label">Record</NvText>
              </NvStack>
              <NvRecordingKeybind />
            </NvGroup>
          </NvCard>
        </NvStack>
      </NvStack>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Development</NvText>
      <NvStack spacing="4">
        <NvStack spacing="4">
          <NvCard>
            <NvGroup no-wrap justify="apart" spacing="5">
              <NvStack>
                <NvText type="label">Debug mode</NvText>
              </NvStack>
              <NvSwitch
                :modelValue="$store.getters['settings/persisted'].debugMode"
                @update:modelValue="
                  (value) => $store.dispatch('settings/setProperty', ['persisted.debugMode', value])
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
import { NvCard, NvGroup, NvStack, NvSwitch, NvText } from '@/core/components'
import NvRecordingKeybind from '@/entities/speech/components/inputs/NvRecordingKeybind.vue'
import NvAutoUpdateChannelSelect from '@/entities/settings/components/inputs/NvAutoUpdateChannelSelect.vue'
</script>
