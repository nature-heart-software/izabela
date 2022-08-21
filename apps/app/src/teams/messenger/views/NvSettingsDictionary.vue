<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Dictionary</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Definitions</NvText>
              <NvText>Provide the definition of a word to help Izabela's pronunciation</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <div>
                <NvButton size="sm" @click="store.dispatch('dictionary/addDefinition')"
                  >Add definition</NvButton
                >
              </div>
              <NvDivider direction="horizontal" />
              <NvGroup class="w-full" grow no-wrap>
                <NvText type="label" class="w-1/2">Word</NvText>
                <NvDivider direction="vertical" class="!grow-0 h-5" />
                <NvText type="label" class="w-1/2">Definition</NvText>
                <NvButton class="!grow-0 invisible" type="plain" icon-name="times" size="xs" />
              </NvGroup>
              <template v-for="(definition, i) in store.getters['dictionary/definitions']" :key="i">
                <NvGroup class="w-full" grow>
                  <NvInput
                    :modelValue="definition[0]"
                    @update:modelValue="
                      (value) =>
                        store.dispatch('dictionary/setProperty', [
                          `persisted.definitions[${i}][0]`,
                          value,
                        ])
                    "
                  />
                  <NvDivider direction="vertical" class="!grow-0 h-5" />
                  <NvInput
                    :modelValue="definition[1]"
                    @update:modelValue="
                      (value) =>
                        store.dispatch('dictionary/setProperty', [
                          `persisted.definitions[${i}][1]`,
                          value,
                        ])
                    "
                  />
                  <NvButton
                    class="!grow-0"
                    type="plain"
                    icon-name="times"
                    size="xs"
                    @click="store.dispatch('dictionary/removeDefinition', i)"
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
import { NvCard, NvGroup, NvStack, NvText, NvInput, NvDivider, NvButton } from '@packages/ui'
import { useStore } from 'vuex'

const store = useStore()
</script>
