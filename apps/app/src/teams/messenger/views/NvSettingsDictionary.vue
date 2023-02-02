<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Dictionary</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Definitions</NvText>
              <NvText>Provide the definition of a word to improve its pronunciation</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <div>
                <NvButton size="sm" @click="addDefinition()">Add definition</NvButton>
              </div>
              <NvDivider direction="horizontal" />
              <NvGroup class="w-full" grow no-wrap>
                <NvText class="w-1/2" type="label">Word</NvText>
                <NvDivider class="!grow-0 h-5" direction="vertical" />
                <NvText class="w-1/2" type="label">Definition</NvText>
                <NvButton class="!grow-0 invisible" icon-name="times" size="xs" type="plain" />
              </NvGroup>
              <template v-for="(definition, i) in definitions" :key="i">
                <NvGroup class="w-full" grow>
                  <NvInput
                    :modelValue="definition[0]"
                    @update:modelValue="(value) => updateDefinition(i, [value, definition[1]])"
                  />
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
                  <NvInput
                    :modelValue="definition[1]"
                    @update:modelValue="(value) => updateDefinition(i, [definition[0], value])"
                  />
                  <NvButton
                    class="!grow-0"
                    icon-name="times"
                    size="xs"
                    type="plain"
                    @click="removeDefinition(i)"
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
import { useDictionaryStore } from '@/features/dictionary/store'
import { storeToRefs } from 'pinia'

const dictionaryStore = useDictionaryStore()
const { addDefinition, removeDefinition, updateDefinition } = dictionaryStore
const { definitions } = storeToRefs(dictionaryStore)
</script>
