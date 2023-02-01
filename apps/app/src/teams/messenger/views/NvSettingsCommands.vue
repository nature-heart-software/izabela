<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Commands</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Commands</NvText>
              <NvText>Provide custom commands for websocket use</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <div>
                <NvButton size="sm" @click="addCustomCommand()">Add command</NvButton>
              </div>
              <NvDivider direction="horizontal" />
              <NvGroup class="w-full" grow no-wrap>
                <NvText class="w-1/2" type="label">Name</NvText>
                <NvDivider class="!grow-0 h-5" direction="vertical" />
                <NvText class="w-1/2" type="label">Description</NvText>
                <NvButton class="!grow-0 invisible" icon-name="times" size="xs" type="plain" />
              </NvGroup>
              <template v-for="(customCommand, i) in customCommands" :key="i">
                <NvGroup class="w-full" grow>
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
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
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
                    class="!grow-0"
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
import { NvButton, NvCard, NvDivider, NvGroup, NvInput, NvStack, NvText } from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useSpeechStore } from '@/features/speech/store'

const speechStore = useSpeechStore()
const { addCustomCommand, updateCustomCommands, removeCustomCommand } = speechStore
const { customCommands } = storeToRefs(speechStore)
</script>
