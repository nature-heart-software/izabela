<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Commands</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Commands</NvText>
              <NvText>Provide custom commands for websocket integration</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div :class="css({ paddingLeft: '8' })">
          <NvCard>
            <NvStack spacing="5">
              <div>
                <NvButton size="sm" @click="addCustomCommand()"
                  >Add command</NvButton
                >
              </div>
              <NvDivider direction="horizontal" />
              <NvGroup :class="css({ width: '100%' })" grow no-wrap>
                <NvText :class="css({ width: '50%' })" type="label"
                  >Name</NvText
                >
                <NvDivider
                  :class="css({ flexGrow: '0 !important', height: '5' })"
                  direction="vertical"
                />
                <NvText :class="css({ width: '50%' })" type="label"
                  >Description</NvText
                >
                <NvButton
                  :class="
                    css({ flexGrow: '0 !important', visibility: 'hidden' })
                  "
                  icon-name="times"
                  size="xs"
                  type="plain"
                />
              </NvGroup>
              <template v-for="(customCommand, i) in customCommands" :key="i">
                <NvGroup :class="css({ width: '100%' })" grow>
                  <NvInput
                    :modelValue="customCommand.name"
                    @update:modelValue="
                      (value) =>
                        updateCustomCommands(i, {
                          ...customCommand,
                          name: value.replace(/[^A-Z0-9]/gi, ''),
                          value: value.replace(/[^A-Z0-9]/gi, '').toLowerCase(),
                        })
                    "
                  />
                  <NvDivider
                    :class="css({ flexGrow: '0 !important', height: '5' })"
                    direction="vertical"
                  />
                  <NvInput
                    :modelValue="customCommand.description"
                    @update:modelValue="
                      (value) =>
                        updateCustomCommands(i, {
                          ...customCommand,
                          description: value,
                        })
                    "
                  />
                  <NvButton
                    :class="css({ flexGrow: '0 !important' })"
                    icon-name="times"
                    size="xs"
                    type="plain"
                    @click="removeCustomCommand(i)"
                  />
                </NvGroup>
              </template>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import {
  NvButton,
  NvCard,
  NvDivider,
  NvGroup,
  NvInput,
  NvStack,
  NvText,
} from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useSpeechStore } from '@/features/speech/store'

const speechStore = useSpeechStore()
const { addCustomCommand, updateCustomCommands, removeCustomCommand } =
  speechStore
const { customCommands } = storeToRefs(speechStore)
</script>
